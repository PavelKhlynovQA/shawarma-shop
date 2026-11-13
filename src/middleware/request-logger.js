// Логирование запросов + X-Request-Id (удобно для баг-репортов).
import crypto from 'node:crypto';

export function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', function () {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      id: requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Math.round(ms * 10) / 10,
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log(line);
    }
  });

  next();
}
