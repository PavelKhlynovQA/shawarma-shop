import express from 'express';
import { ApiError } from '../lib/errors.js';
import { isNonEmptyString, isPositiveInt } from '../lib/validate.js';

const TRANSITIONS = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COOKING', 'CANCELLED'],
  COOKING: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

export function createAdminRouter(ctx) {
  const router = express.Router();
  const db = ctx.db;

  router.use('/admin', ctx.requireAdmin);

  router.get('/admin/stats', async function (req, res, next) {
    try {
      const byStatus = await db.query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status');
      const revenueRow = await db.get(
        "SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE status <> 'CANCELLED'"
      );
      const todayRow = await db.get('SELECT COUNT(*) AS count FROM orders WHERE created_at >= ?', [
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      ]);
      const topProducts = await db.query(
        'SELECT name, SUM(quantity) AS sold FROM order_items GROUP BY name ORDER BY sold DESC LIMIT 5'
      );

      const statuses = {};
      byStatus.forEach(function (row) { statuses[row.status] = Number(row.count); });

      res.json({
        stats: {
          ordersTotal: Number(revenueRow.orders),
          ordersToday: Number(todayRow.count),
          revenue: Number(revenueRow.revenue),
          byStatus: statuses,
          topProducts: topProducts.map(function (row) {
            return { name: row.name, sold: Number(row.sold) };
          }),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/orders', async function (req, res, next) {
    try {
      const status = req.query.status;
      const limit = Math.min(Number(req.query.limit || 50), 200);
      const offset = Number(req.query.offset || 0);

      const rows = status
        ? await db.query('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [status, limit, offset])
        : await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);

      res.json({
        orders: rows.map(function (row) {
          return {
            id: row.id,
            publicId: row.public_id,
            status: row.status,
            customerName: row.customer_name,
            phone: row.phone,
            total: row.total,
            deliveryType: row.delivery_type,
            createdAt: row.created_at,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/admin/orders/:id/status', async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) throw ApiError.badRequest('id должен быть числом');

      const body = req.body || {};
      const nextStatus = body.status;
      if (!nextStatus || !TRANSITIONS[nextStatus]) {
        throw ApiError.badRequest('Неизвестный статус', [{ field: 'status', message: 'Допустимые: ' + Object.keys(TRANSITIONS).join(', ') }]);
      }

      const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
      if (!order) throw ApiError.notFound('Заказ не найден');

      const allowed = TRANSITIONS[order.status] || [];
      if (!allowed.includes(nextStatus)) {
        throw ApiError.conflict(
          'INVALID_STATUS_TRANSITION',
          'Недопустимый переход: ' + order.status + ' -> ' + nextStatus + '. Разрешено: ' + (allowed.join(', ') || 'нет')
        );
      }

      const now = new Date().toISOString();
      await db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [nextStatus, now, id]);
      await db.run('INSERT INTO order_status_history (order_id, status, note, created_at) VALUES (?, ?, ?, ?)', [
        id,
        nextStatus,
        body.note || null,
        now,
      ]);

      res.json({ order: { id: id, publicId: order.public_id, status: nextStatus, updatedAt: now } });
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/products', async function (req, res, next) {
    try {
      const rows = await db.query('SELECT * FROM products ORDER BY id ASC');
      res.json({
        products: rows.map(function (row) {
          return {
            id: row.id,
            categoryId: row.category_id,
            name: row.name,
            description: row.description,
            price: row.price,
            isAvailable: Boolean(row.is_available),
            isSpicy: Boolean(row.is_spicy),
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/admin/products', async function (req, res, next) {
    try {
      const body = req.body || {};
      const errors = [];
      if (!isPositiveInt(body.categoryId)) errors.push({ field: 'categoryId', message: 'Должно быть целым числом' });
      if (!isNonEmptyString(body.name)) errors.push({ field: 'name', message: 'Поле обязательно' });
      if (!Number.isInteger(body.price) || body.price <= 0) errors.push({ field: 'price', message: 'Цена должна быть положительным числом' });
      if (errors.length) throw ApiError.badRequest('Некорректные данные товара', errors);

      const category = await db.get('SELECT id FROM categories WHERE id = ?', [body.categoryId]);
      if (!category) throw ApiError.badRequest('Категория не найдена', [{ field: 'categoryId', message: 'Категория не существует' }]);

      const created = await db.get(
        'INSERT INTO products (category_id, name, description, price, weight_g, is_spicy, is_available, emoji, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
        [
          body.categoryId,
          body.name.trim(),
          body.description || null,
          body.price,
          body.weightG || null,
          body.isSpicy ? 1 : 0,
          body.isAvailable === false ? 0 : 1,
          body.emoji || '🌯',
          new Date().toISOString(),
        ]
      );

      res.status(201).json({ product: { id: created.id, name: body.name, price: body.price } });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/admin/products/:id', async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
      if (!product) throw ApiError.notFound('Товар не найден');

      const body = req.body || {};
      const updates = [];
      const params = [];

      if (body.name !== undefined) {
        if (!isNonEmptyString(body.name)) throw ApiError.badRequest('Некорректное название');
        updates.push('name = ?');
        params.push(body.name.trim());
      }
      if (body.price !== undefined) {
        if (!Number.isInteger(body.price) || body.price <= 0) throw ApiError.badRequest('Цена должна быть положительным числом');
        updates.push('price = ?');
        params.push(body.price);
      }
      if (body.isAvailable !== undefined) {
        updates.push('is_available = ?');
        params.push(body.isAvailable ? 1 : 0);
      }
      if (body.description !== undefined) {
        updates.push('description = ?');
        params.push(body.description);
      }

      if (!updates.length) throw ApiError.badRequest('Нет полей для обновления');

      params.push(id);
      await db.run('UPDATE products SET ' + updates.join(', ') + ' WHERE id = ?', params);

      res.json({ product: { id: id, updated: true } });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/admin/products/:id', async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
      if (!product) throw ApiError.notFound('Товар не найден');

      await db.run('UPDATE products SET is_available = 0 WHERE id = ?', [id]);
      res.json({ product: { id: id, isAvailable: false }, message: 'Товар скрыт из меню' });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
