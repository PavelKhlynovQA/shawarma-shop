import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requestLogger } from './middleware/request-logger.js';
import { optionalAuth, requireAuth, requireAdmin } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';

import { createHealthRouter } from './routes/health.js';
import { createMenuRouter } from './routes/menu.js';
import { createAuthRouter } from './routes/auth.js';
import { createPromoRouter } from './routes/promo.js';
import { createOrdersRouter } from './routes/orders.js';
import { createAdminRouter } from './routes/admin.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(currentDir, '..', 'public');

export function createApp(ctx) {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json({ limit: '100kb' }));
  app.use(requestLogger);

  // CORS — чтобы можно было дергать API из Postman и браузера
  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const routerCtx = Object.assign({}, ctx, {
    optionalAuth: optionalAuth(ctx.config),
    requireAuth: requireAuth(ctx.config),
    requireAdmin: requireAdmin(ctx.config),
  });

  app.use('/api', createHealthRouter(routerCtx));
  app.use('/api', createMenuRouter(routerCtx));
  app.use('/api', createAuthRouter(routerCtx));
  app.use('/api', createPromoRouter(routerCtx));
  app.use('/api', createOrdersRouter(routerCtx));
  app.use('/api', createAdminRouter(routerCtx));

  app.use(express.static(publicDir));

  app.get('/admin', function (req, res) {
    res.sendFile(path.join(publicDir, 'admin.html'));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
