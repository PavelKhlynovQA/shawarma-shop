import express from 'express';
import crypto from 'node:crypto';
import { ApiError } from '../lib/errors.js';
import { isNonEmptyString, isPhone } from '../lib/validate.js';

export const MIN_DELIVERY_TOTAL = 500;
const MAX_ITEM_QUANTITY = 20;

function generatePublicId() {
  const now = new Date();
  const stamp =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  return 'SH-' + stamp + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
}

export function createOrdersRouter(ctx) {
  const router = express.Router();
  const db = ctx.db;

  async function validatePromo(code, subtotal) {
    if (!code) return { promo: null, discount: 0 };
    const normalized = String(code).trim().toUpperCase();
    const promo = await db.get('SELECT * FROM promocodes WHERE code = ?', [normalized]);
    if (!promo) throw ApiError.badRequest('Промокод не найден', [{ field: 'promoCode', message: 'Промокод не найден' }]);
    if (!promo.is_active) throw ApiError.conflict('PROMO_INACTIVE', 'Промокод неактивен');
    if (promo.valid_until && new Date(promo.valid_until).getTime() < Date.now()) {
      throw ApiError.conflict('PROMO_EXPIRED', 'Срок действия промокода истёк');
    }
    if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
      throw ApiError.conflict('PROMO_LIMIT_EXCEEDED', 'Лимит использований промокода исчерпан');
    }
    return { promo: promo, discount: Math.floor((subtotal * promo.discount_percent) / 100) };
  }

  async function loadOrder(publicId) {
    const order = await db.get('SELECT * FROM orders WHERE public_id = ?', [publicId]);
    if (!order) return null;
    const items = await db.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [order.id]);
    const history = await db.query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC', [order.id]);
    return { order: order, items: items, history: history };
  }

  function serialize(record) {
    const order = record.order;
    return {
      publicId: order.public_id,
      status: order.status,
      customerName: order.customer_name,
      phone: order.phone,
      address: order.address,
      comment: order.comment,
      deliveryType: order.delivery_type,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      promoCode: order.promo_code,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: record.items.map(function (item) {
        let extras = [];
        try {
          extras = item.extras ? JSON.parse(item.extras) : [];
        } catch (e) {
          extras = [];
        }
        return {
          productId: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          extras: extras,
          lineTotal: item.line_total,
        };
      }),
      history: record.history.map(function (row) {
        return { status: row.status, note: row.note, createdAt: row.created_at };
      }),
    };
  }

  router.post('/orders', ctx.optionalAuth, async function (req, res, next) {
    try {
      const body = req.body || {};
      const errors = [];
      const deliveryType = body.deliveryType || 'delivery';

      if (!isNonEmptyString(body.customerName)) errors.push({ field: 'customerName', message: 'Поле обязательно' });
      if (!isPhone(body.phone)) errors.push({ field: 'phone', message: 'Некорректный телефон' });
      if (deliveryType !== 'delivery' && deliveryType !== 'pickup') {
        errors.push({ field: 'deliveryType', message: 'Допустимо: delivery или pickup' });
      }
      if (deliveryType === 'delivery' && !isNonEmptyString(body.address)) {
        errors.push({ field: 'address', message: 'Адрес обязателен при доставке' });
      }

      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) errors.push({ field: 'items', message: 'Корзина пуста' });
      items.forEach(function (item, index) {
        if (!Number.isInteger(item.productId)) {
          errors.push({ field: 'items[' + index + '].productId', message: 'Должно быть целым числом' });
        }
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY) {
          errors.push({ field: 'items[' + index + '].quantity', message: 'Количество от 1 до ' + MAX_ITEM_QUANTITY });
        }
      });

      if (errors.length) throw ApiError.badRequest('Некорректные данные заказа', errors);

      const productIds = [];
      items.forEach(function (item) {
        if (productIds.indexOf(item.productId) === -1) productIds.push(item.productId);
      });
      const placeholders = productIds.map(function () { return '?'; }).join(',');
      const productRows = await db.query('SELECT * FROM products WHERE id IN (' + placeholders + ')', productIds);
      const productsById = {};
      productRows.forEach(function (row) { productsById[row.id] = row; });

      const extraIds = [];
      items.forEach(function (item) {
        (item.extraIds || []).forEach(function (id) {
          if (extraIds.indexOf(id) === -1) extraIds.push(id);
        });
      });
      let extrasById = {};
      if (extraIds.length) {
        const extraPlaceholders = extraIds.map(function () { return '?'; }).join(',');
        const extraRows = await db.query('SELECT * FROM extras WHERE id IN (' + extraPlaceholders + ')', extraIds);
        extraRows.forEach(function (row) { extrasById[row.id] = row; });
      }

      let subtotal = 0;
      const preparedItems = [];

      for (const item of items) {
        const product = productsById[item.productId];
        if (!product) {
          throw ApiError.badRequest('Товар не найден', [{ field: 'items', message: 'Товар id=' + item.productId + ' не существует' }]);
        }
        if (!product.is_available) {
          throw ApiError.conflict('PRODUCT_UNAVAILABLE', 'Товар недоступен: ' + product.name);
        }

        let extrasSum = 0;
        const chosenExtras = [];
        for (const extraId of item.extraIds || []) {
          const extra = extrasById[extraId];
          if (!extra) {
            throw ApiError.badRequest('Дополнитель не найден', [{ field: 'items', message: 'Дополнитель id=' + extraId + ' не существует' }]);
          }
          extrasSum += extra.price;
          chosenExtras.push({ id: extra.id, name: extra.name, price: extra.price });
        }

        const lineTotal = (product.price + extrasSum) * item.quantity;
        subtotal += lineTotal;

        preparedItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          extras: chosenExtras,
          lineTotal: lineTotal,
        });
      }

      if (deliveryType === 'delivery' && subtotal < MIN_DELIVERY_TOTAL) {
        throw ApiError.conflict('MIN_ORDER_AMOUNT', 'Минимальная сумма заказа с доставкой — ' + MIN_DELIVERY_TOTAL + ' руб.');
      }

      const promoResult = await validatePromo(body.promoCode, subtotal);
      const discount = promoResult.discount;
      const total = Math.max(0, subtotal - discount);

      let publicId = generatePublicId();
      let attempts = 0;
      while (attempts < 5) {
        const clash = await db.get('SELECT id FROM orders WHERE public_id = ?', [publicId]);
        if (!clash) break;
        publicId = generatePublicId();
        attempts += 1;
      }

      const now = new Date().toISOString();
      const created = await db.get(
        'INSERT INTO orders (public_id, user_id, customer_name, phone, address, comment, delivery_type, status, subtotal, discount, total, promo_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
        [
          publicId,
          req.user ? req.user.id : null,
          body.customerName.trim(),
          body.phone,
          deliveryType === 'delivery' ? body.address : null,
          body.comment || null,
          deliveryType,
          'NEW',
          subtotal,
          discount,
          total,
          promoResult.promo ? promoResult.promo.code : null,
          now,
          now,
        ]
      );

      for (const item of preparedItems) {
        await db.run(
          'INSERT INTO order_items (order_id, product_id, name, price, quantity, extras, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [created.id, item.productId, item.name, item.price, item.quantity, JSON.stringify(item.extras), item.lineTotal]
        );
      }

      await db.run(
        'INSERT INTO order_status_history (order_id, status, note, created_at) VALUES (?, ?, ?, ?)',
        [created.id, 'NEW', 'Заказ создан', now]
      );

      if (promoResult.promo) {
        await db.run('UPDATE promocodes SET used_count = used_count + 1 WHERE id = ?', [promoResult.promo.id]);
      }

      const record = await loadOrder(publicId);
      res.status(201).json({ order: serialize(record) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders', ctx.requireAuth, async function (req, res, next) {
    try {
      const rows = await db.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
        [req.user.id]
      );
      res.json({
        orders: rows.map(function (row) {
          return {
            publicId: row.public_id,
            status: row.status,
            total: row.total,
            createdAt: row.created_at,
            deliveryType: row.delivery_type,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/:publicId', async function (req, res, next) {
    try {
      const record = await loadOrder(req.params.publicId);
      if (!record) return next(ApiError.notFound('Заказ не найден'));
      res.json({ order: serialize(record) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/orders/:publicId/history', async function (req, res, next) {
    try {
      const record = await loadOrder(req.params.publicId);
      if (!record) return next(ApiError.notFound('Заказ не найден'));
      res.json({
        history: record.history.map(function (row) {
          return { status: row.status, note: row.note, createdAt: row.created_at };
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
