import express from 'express';
import crypto from 'node:crypto';
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

  // ---------- Вход по номеру телефона ----------

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  router.post('/auth/phone/request-code', async function (req, res, next) {
    try {
      const body = req.body || {};
      const phone = digitsOnly(body.phone);

      if (phone.length < 10 || phone.length > 15) {
        throw ApiError.badRequest('Некорректный телефон', [{ field: 'phone', message: 'От 10 до 15 цифр' }]);
      }

      const code = String(crypto.randomInt(1000, 10000));
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

      await db.run(
        'INSERT INTO otp_codes (phone, code, expires_at, attempts, used, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [phone, code, expiresAt, 0, 0, now.toISOString()]
      );

      res.json({
        message: 'Код отправлен',
        phone: phone,
        expiresInSeconds: 300,
        // Демо-режим: код возвращается в ответе, чтобы можно было тестировать без SMS-шлюза.
        debugCode: code,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/phone/verify', async function (req, res, next) {
    try {
      const body = req.body || {};
      const phone = digitsOnly(body.phone);
      const code = String(body.code || '').trim();

      if (!code) {
        throw ApiError.badRequest('Введите код из SMS', [{ field: 'code', message: 'Поле обязательно' }]);
      }

      const otp = await db.get(
        'SELECT * FROM otp_codes WHERE phone = ? AND used = 0 ORDER BY id DESC LIMIT 1',
        [phone]
      );

      if (!otp) throw ApiError.notFound('Код не найден. Запросите новый');
      if (new Date(otp.expires_at).getTime() < Date.now()) {
        throw ApiError.conflict('OTP_EXPIRED', 'Код истёк. Запросите новый');
      }
      if (otp.attempts >= 5) {
        throw ApiError.conflict('OTP_TOO_MANY_ATTEMPTS', 'Слишком много попыток. Запросите новый код');
      }
      if (otp.code !== code) {
        await db.run('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
        throw ApiError.badRequest('Неверный код', [{ field: 'code', message: 'Неверный код' }]);
      }

      await db.run('UPDATE otp_codes SET used = 1 WHERE id = ?', [otp.id]);

      let user = await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
      if (!user) {
        user = await db.get(
          'INSERT INTO users (email, password_hash, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, email, name, phone, role',
          ['phone' + phone + '@shawarma.local', 'otp-only', 'Гость ' + phone.slice(-4), phone, 'customer', new Date().toISOString()]
        );
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
