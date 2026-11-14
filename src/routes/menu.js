import express from 'express';
import { ApiError } from '../lib/errors.js';

export function createMenuRouter(ctx) {
  const router = express.Router();
  const db = ctx.db;

  function mapProduct(row) {
    return {
      id: row.id,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      price: row.price,
      weightG: row.weight_g,
      isSpicy: Boolean(row.is_spicy),
      isAvailable: Boolean(row.is_available),
      emoji: row.emoji,
      imageUrl: row.image_url || null,
    };
  }

  router.get('/menu', async function (req, res, next) {
    try {
      const includeUnavailable = req.query.includeUnavailable === 'true';
      const categories = await db.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
      const products = await db.query(
        includeUnavailable
          ? 'SELECT * FROM products ORDER BY id ASC'
          : 'SELECT * FROM products WHERE is_available = 1 ORDER BY id ASC'
      );

      const byCategory = {};
      for (const product of products) {
        if (!byCategory[product.category_id]) byCategory[product.category_id] = [];
        byCategory[product.category_id].push(mapProduct(product));
      }

      res.json({
        categories: categories.map(function (category) {
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            products: byCategory[category.id] || [],
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/products/:id', async function (req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return next(ApiError.badRequest('id должен быть числом'));
      const row = await db.get('SELECT * FROM products WHERE id = ?', [id]);
      if (!row) return next(ApiError.notFound('Товар не найден'));
      res.json({ product: mapProduct(row) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/extras', async function (req, res, next) {
    try {
      const rows = await db.query('SELECT * FROM extras WHERE is_available = 1 ORDER BY id ASC');
      res.json({
        extras: rows.map(function (row) {
          return { id: row.id, name: row.name, price: row.price };
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
