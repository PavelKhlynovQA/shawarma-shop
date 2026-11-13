// Поднимает приложение на случайном порту с отдельной тестовой БД SQLite.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { createDb } from '../../src/db/index.js';
import { ddl } from '../../src/db/schema.js';
import { seedIfEmpty } from '../../src/db/seed.js';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config.js';

export async function startTestServer() {
  const file = path.join('data', 'test-' + crypto.randomUUID() + '.db');
  const db = await createDb({ driver: 'sqlite', sqliteFile: file });

  for (const statement of ddl('sqlite')) {
    await db.exec(statement);
  }
  await seedIfEmpty(db);

  const app = createApp({ db: db, config: config });

  const server = await new Promise(function (resolve) {
    const instance = app.listen(0, function () { resolve(instance); });
  });

  const port = server.address().port;

  return {
    url: 'http://127.0.0.1:' + port,
    db: db,
    async close() {
      await new Promise(function (resolve) { server.close(resolve); });
      await db.close();
      try { fs.unlinkSync(file); } catch (error) {}
    },
  };
}

export async function jsonCall(url, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch(url + path, {
    method: method,
    headers: headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await response.json(); } catch (error) { data = null; }
  return { status: response.status, body: data, headers: response.headers };
}
