// Отдельный запуск наполнения БД: npm run seed
import { config } from '../config.js';
import { createDb } from './index.js';
import { ddl } from './schema.js';
import { seedIfEmpty } from './seed.js';

const db = await createDb(config.db);

for (const statement of ddl(db.driver)) {
  await db.exec(statement);
}

const result = await seedIfEmpty(db);
console.log('СУБД: ' + db.driver);
console.log(result.seeded ? 'База наполнена: товаров ' + result.products : 'База уже содержит данные (товаров ' + result.products + '), пропускаем');

const categories = await db.query('SELECT COUNT(*) AS c FROM categories');
const orders = await db.query('SELECT COUNT(*) AS c FROM orders');
console.log('Категорий: ' + categories[0].c + ', заказов: ' + orders[0].c);
console.log('Демо-доступ:');
console.log('  админ:      admin@shawarma.ru / Admin123!');
console.log('  покупатель: customer@test.ru / Test123!');

await db.close();
