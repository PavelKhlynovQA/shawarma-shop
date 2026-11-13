import { config } from './config.js';
import { createDb } from './db/index.js';
import { ddl } from './db/schema.js';
import { seedIfEmpty } from './db/seed.js';
import { createApp } from './app.js';

async function main() {
  const db = await createDb(config.db);

  for (const statement of ddl(db.driver)) {
    await db.exec(statement);
  }

  if (config.seedOnStart) {
    const result = await seedIfEmpty(db);
    if (result.seeded) {
      console.log('[seed] добавлено товаров: ' + result.products);
    }
  }

  const app = createApp({ db: db, config: config });

  const server = app.listen(config.port, function () {
    console.log('');
    console.log('  🌯  Шаурма-Мастер — сервер запущен');
    console.log('  СУБД:   ' + db.driver);
    console.log('  Витрина: http://localhost:' + config.port + '/');
    console.log('  Админка: http://localhost:' + config.port + '/admin');
    console.log('  API:     http://localhost:' + config.port + '/api/health');
    console.log('');
  });

  let stopping = false;
  async function shutdown(signal) {
    if (stopping) return;
    stopping = true;
    console.log('\n[shutdown] ' + signal);
    server.close();
    await db.close();
    process.exit(0);
  }

  process.on('SIGINT', function () { shutdown('SIGINT'); });
  process.on('SIGTERM', function () { shutdown('SIGTERM'); });
}

main().catch(function (error) {
  console.error('Не удалось запустить сервер:', error);
  process.exit(1);
});
