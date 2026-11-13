import express from 'express';
import { ApiError } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { isEmail, isNonEmptyString, isPhone } from '../lib/validate.js';

export function createAuthRouter(ctx) {
  const router = express.Router();
  const db = ctx.db;
  const config = ctx.config;

  function issue(user) {
    const token = signToken(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      config.jwtTtlSeconds
    );
    return {
      token: token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
    };
  }

  router.post('/auth/register', async function (req, res, next) {
    try {
      const body = req.body || {};
      const errors = [];

      if (!isEmail(body.email)) errors.push({ field: 'email', message: 'Некорректный email' });
      if (typeof body.password !== 'string' || body.password.length < 6) {
        errors.push({ field: 'password', message: 'Пароль должен быть не короче 6 символов' });
      }
      if (!isNonEmptyString(body.name)) errors.push({ field: 'name', message: 'Поле обязательно' });
      if (body.phone && !isPhone(body.phone)) errors.push({ field: 'phone', message: 'Некорректный телефон' });

      if (errors.length) throw ApiError.badRequest('Некорректные данные запроса', errors);

      const existing = await db.get('SELECT id FROM users WHERE email = ?', [body.email.toLowerCase()]);
      if (existing) throw ApiError.conflict('EMAIL_TAKEN', 'Пользователь с таким email уже существует');

      const created = await db.get(
        'INSERT INTO users (email, password_hash, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, email, name, phone, role',
        [body.email.toLowerCase(), hashPassword(body.password), body.name.trim(), body.phone || null, 'customer', new Date().toISOString()]
      );

      res.status(201).json(issue(created));
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/login', async function (req, res, next) {
    try {
      const body = req.body || {};
      const errors = [];
      if (!isEmail(body.email)) errors.push({ field: 'email', message: 'Некорректный email' });
      if (!isNonEmptyString(body.password)) errors.push({ field: 'password', message: 'Поле обязательно' });
      if (errors.length) throw ApiError.badRequest('Некорректные данные запроса', errors);

      const user = await db.get('SELECT * FROM users WHERE email = ?', [body.email.toLowerCase()]);
      if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');
      if (!verifyPassword(body.password, user.password_hash)) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'Неверный email или пароль');
      }

      res.json(issue(user));
    } catch (error) {
      next(error);
    }
  });

  router.get('/auth/me', ctx.requireAuth, async function (req, res, next) {
    try {
      const user = await db.get('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?', [req.user.id]);
      if (!user) throw ApiError.unauthorized('Пользователь не найден');
      res.json({ user: user });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
