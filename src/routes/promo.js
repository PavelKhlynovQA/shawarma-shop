import express from 'express';
import { ApiError } from '../lib/errors.js';

export function createPromoRouter(ctx) {
  const router = express.Router();
  const db = ctx.db;

  router.post('/promo/validate', async function (req, res, next) {
    try {
      const body = req.body || {};
      const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
      const subtotal = Number(body.subtotal || 0);

      if (!code) throw ApiError.badRequest('Код промокода обязателен', [{ field: 'code', message: 'Поле обязательно' }]);

      const promo = await db.get('SELECT * FROM promocodes WHERE code = ?', [code]);
      if (!promo) throw ApiError.notFound('Промокод не найден');
      if (!promo.is_active) throw ApiError.conflict('PROMO_INACTIVE', 'Промокод неактивен');
      if (promo.valid_until && new Date(promo.valid_until).getTime() < Date.now()) {
        throw ApiError.conflict('PROMO_EXPIRED', 'Срок действия промокода истёк');
      }
      if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
        throw ApiError.conflict('PROMO_LIMIT_EXCEEDED', 'Лимит использований промокода исчерпан');
      }

      const discount = Math.floor((subtotal * promo.discount_percent) / 100);

      res.json({
        promo: {
          code: promo.code,
          discountPercent: promo.discount_percent,
          discount: discount,
          total: Math.max(0, subtotal - discount),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
