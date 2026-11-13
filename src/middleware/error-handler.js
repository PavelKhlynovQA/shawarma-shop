// Централизованная обработка ошибок.
import { ApiError } from '../lib/errors.js';

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', 'Маршрут не найден: ' + req.method + ' ' + req.originalUrl));
}

export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Тело запроса не является корректным JSON', details: null },
    });
  }

  console.error('UNHANDLED', req.method, req.originalUrl, err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера', details: null },
    requestId: req.requestId,
  });
}
