import express from 'express';

export function createHealthRouter(ctx) {
  const router = express.Router();

  router.get('/health', function (req, res) {
    res.json({
      status: 'ok',
      dbDriver: ctx.db.driver,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
