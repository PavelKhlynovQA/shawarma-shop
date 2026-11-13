// Конфигурация приложения. Все значения можно переопределить через переменные окружения.

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me-in-production',
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS || 86400),

  db: {
    // Если задан DATABASE_URL — работаем с PostgreSQL, иначе с локальным SQLite.
    driver: process.env.DB_DRIVER || (process.env.DATABASE_URL ? 'postgres' : 'sqlite'),
    url: process.env.DATABASE_URL || 'postgres://shawarma:shawarma@localhost:5432/shawarma',
    sqliteFile: process.env.SQLITE_FILE || './data/shawarma.db',
  },

  seedOnStart: process.env.SEED_ON_START !== 'false',
};
