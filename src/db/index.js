// Слой доступа к БД. Один интерфейс для PostgreSQL и SQLite.
// Запросы пишутся с ? вместо $1 — для PostgreSQL плейсхолдеры конвертируются автоматически.
import fs from 'node:fs';
import path from 'node:path';

function toPgPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, function () {
    index += 1;
    return '$' + index;
  });
}

export async function createDb(dbConfig) {
  if (dbConfig.driver === 'postgres') {
    const pgModule = await import('pg');
    const Pool = pgModule.default.Pool;
    const pool = new Pool({ connectionString: dbConfig.url, max: 10 });

    return {
      driver: 'postgres',
      async query(sql, params) {
        const result = await pool.query(toPgPlaceholders(sql), params || []);
        return result.rows;
      },
      async get(sql, params) {
        const rows = await this.query(sql, params);
        return rows.length ? rows[0] : null;
      },
      async run(sql, params) {
        const result = await pool.query(toPgPlaceholders(sql), params || []);
        return { changes: result.rowCount };
      },
      async exec(sql) {
        await pool.query(sql);
      },
      async close() {
        await pool.end();
      },
    };
  }

  const sqliteModule = await import('node:sqlite');
  const DatabaseSync = sqliteModule.DatabaseSync;
  const file = dbConfig.sqliteFile;
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec('PRAGMA foreign_keys = ON;');

  return {
    driver: 'sqlite',
    async query(sql, params) {
      const stmt = database.prepare(sql);
      return stmt.all.apply(stmt, params || []);
    },
    async get(sql, params) {
      const stmt = database.prepare(sql);
      const row = stmt.get.apply(stmt, params || []);
      return row === undefined ? null : row;
    },
    async run(sql, params) {
      const stmt = database.prepare(sql);
      const info = stmt.run.apply(stmt, params || []);
      return { changes: Number(info.changes) };
    },
    async exec(sql) {
      database.exec(sql);
    },
    async close() {
      database.close();
    },
  };
}
