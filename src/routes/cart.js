import express from 'express';
import crypto from 'node:crypto';
import { ApiError } from '../lib/errors.js';

const MAX_QUANTITY = 20;

export function createCartRouter(ctx) {
  const router = express.Router();
  const db = ctx.db;

  function nowIso() {
    return new Date().toISOString();
  }

  function parseCartId(value) {
    const id = String(value || '').trim();
    if (!id) return null;
    if (id.length < 8 || id.length > 64) return null;
    if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
    return id;
  }

  async function ensureCart(req, res) {
    let cartId = parseCartId(req.get('X-Cart-Id'));
    if (!cartId) {
      cartId = crypto.randomBytes(16).toString('hex');
    }
    const existing = await db.get('SELECT * FROM carts WHERE id = ?', [cartId]);
    if (!existing) {
      await db.run('INSERT INTO carts (id, created_at, updated_at) VALUES (?, ?, ?)', [
        cartId,
        nowIso(),
        nowIso(),
      ]);
    }
    res.setHeader('X-Cart-Id', cartId);
    return cartId;
  }

  function normalizeExtras(raw) {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw)) {
      throw ApiError.badRequest('Некорректные данные запроса', [
        { field: 'extras', message: 'Ожидается массив id дополнителей' },
      ]);
    }
    const ids = raw.map((value) => Number(value));
    ids.forEach((id) => {
      if (!Number.isInteger(id) || id <= 0) {
        throw ApiError.badRequest('Некорректные данные запроса', [
          { field: 'extras', message: 'Идентификатор дополнителя должен быть положительным целым' },
        ]);
      }
    });
    return [...new Set(ids)].sort((a, b) => a - b);
  }

  async function loadExtras(ids) {
    const extras = [];
    for (const id of ids) {
      const row = await db.get('SELECT * FROM extras WHERE id = ?', [id]);
      if (!row) {
        throw ApiError.badRequest('Некорректные данные запроса', [
          { field: 'extras', message: 'Дополнитель id=' + id + ' не существует' },
        ]);
      }
      if (!row.is_available) {
        throw ApiError.conflict('EXTRA_UNAVAILABLE', 'Дополнитель недоступен: ' + row.name);
      }
      extras.push({ id: row.id, name: row.name, price: row.price });
    }
    return extras;
  }

  async function loadCart(cartId) {
    const rows = await db.query('SELECT * FROM cart_items WHERE cart_id = ? ORDER BY id ASC', [cartId]);
    const items = [];
    let subtotal = 0;
    let count = 0;

    for (const row of rows) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [row.product_id]);
      if (!product) continue;

      let extraIds = [];
      try {
        extraIds = row.extras ? JSON.parse(row.extras) : [];
      } catch (error) {
        extraIds = [];
      }
      const extras = await loadExtras(extraIds);
      const unitPrice = product.price + extras.reduce((sum, extra) => sum + extra.price, 0);
      const lineTotal = unitPrice * row.quantity;

      subtotal += lineTotal;
      count += row.quantity;

      items.push({
        id: row.id,
        productId: product.id,
        name: product.name,
        emoji: product.emoji,
        price: product.price,
        quantity: row.quantity,
        extras,
        unitPrice,
        lineTotal,
      });
    }

    return { id: cartId, items, subtotal, count };
  }

  async function loadItem(cartId, itemId) {
    const id = Number(itemId);
    if (!Number.isInteger(id) || id <= 0) {
      throw ApiError.notFound('Позиция корзины не найдена');
    }
    const row = await db.get('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?', [id, cartId]);
    if (!row) throw ApiError.notFound('Позиция корзины не найдена');
    return row;
  }

  // GET /api/cart — текущая корзина
  router.get('/cart', async function (req, res, next) {
    try {
      const cartId = await ensureCart(req, res);
      res.json({ cart: await loadCart(cartId) });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/cart/items — добавить товар
  router.post('/cart/items', async function (req, res, next) {
    try {
      const cartId = await ensureCart(req, res);
      const body = req.body || {};

      const productId = Number(body.productId);
      if (!Number.isInteger(productId) || productId <= 0) {
        throw ApiError.badRequest('Некорректные данные запроса', [
          { field: 'productId', message: 'Идентификатор товара должен быть положительным целым' },
        ]);
      }

      const quantity = body.quantity === undefined ? 1 : Number(body.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        throw ApiError.badRequest('Некорректное количество', [
          { field: 'quantity', message: 'Количество должно быть целым от 1 до ' + MAX_QUANTITY },
        ]);
      }

      const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
      if (!product) throw ApiError.notFound('Товар не найден');
      if (!product.is_available) {
        throw ApiError.conflict('PRODUCT_UNAVAILABLE', 'Товар недоступен для заказа');
      }

      const extraIds = normalizeExtras(body.extras);
      await loadExtras(extraIds);
      const extrasKey = JSON.stringify(extraIds);

      const existing = await db.query('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', [
        cartId,
        productId,
      ]);
      const same = existing.find(function (row) {
        let ids = [];
        try {
          ids = row.extras ? JSON.parse(row.extras) : [];
        } catch (error) {
          ids = [];
        }
        return JSON.stringify(ids) === extrasKey;
      });

      if (same) {
        const nextQuantity = Math.min(MAX_QUANTITY, same.quantity + quantity);
        await db.run('UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?', [
          nextQuantity,
          nowIso(),
          same.id,
        ]);
      } else {
        await db.run(
          'INSERT INTO cart_items (cart_id, product_id, quantity, extras, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [cartId, productId, quantity, extrasKey, nowIso(), nowIso()]
        );
      }

      res.status(201).json({ cart: await loadCart(cartId) });
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/cart/items/:id — изменить количество
  router.patch('/cart/items/:id', async function (req, res, next) {
    try {
      const cartId = await ensureCart(req, res);
      const item = await loadItem(cartId, req.params.id);
      const body = req.body || {};

      const quantity = Number(body.quantity);
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) {
        throw ApiError.badRequest('Некорректное количество', [
          { field: 'quantity', message: 'Количество должно быть целым от 0 до ' + MAX_QUANTITY },
        ]);
      }

      if (quantity === 0) {
        await db.run('DELETE FROM cart_items WHERE id = ?', [item.id]);
      } else {
        await db.run('UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?', [
          quantity,
          nowIso(),
          item.id,
        ]);
      }

      res.json({ cart: await loadCart(cartId) });
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/cart/items/:id — удалить позицию
  router.delete('/cart/items/:id', async function (req, res, next) {
    try {
      const cartId = await ensureCart(req, res);
      const item = await loadItem(cartId, req.params.id);
      await db.run('DELETE FROM cart_items WHERE id = ?', [item.id]);
      res.json({ cart: await loadCart(cartId) });
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/cart — очистить корзину
  router.delete('/cart', async function (req, res, next) {
    try {
      const cartId = await ensureCart(req, res);
      await db.run('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
      res.json({ cart: await loadCart(cartId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
