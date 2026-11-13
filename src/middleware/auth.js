// Аутентификация по Bearer-токену.
import { verifyToken } from '../lib/jwt.js';
import { ApiError } from '../lib/errors.js';

function extractUser(req, config) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  const payload = verifyToken(token, config.jwtSecret);
  if (!payload) return null;
  return { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
}

export function optionalAuth(config) {
  return function (req, res, next) {
    req.user = extractUser(req, config);
    next();
  };
}

export function requireAuth(config) {
  return function (req, res, next) {
    const user = extractUser(req, config);
    if (!user) return next(ApiError.unauthorized('Неверный или истёкший токен'));
    req.user = user;
    next();
  };
}

export function requireAdmin(config) {
  return function (req, res, next) {
    const user = extractUser(req, config);
    if (!user) return next(ApiError.unauthorized('Неверный или истёкший токен'));
    if (user.role !== 'admin') return next(ApiError.forbidden('Доступ только для администратора'));
    req.user = user;
    next();
  };
}
