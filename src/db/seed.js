// Наполнение БД демо-данными. Идемпотентно: если товары уже есть — ничего не делает.
import { hashPassword } from '../lib/password.js';

export const DEMO_USERS = [
  { email: 'admin@shawarma.ru', password: 'Admin123!', name: 'Администратор', phone: '+7 900 000-00-01', role: 'admin' },
  { email: 'customer@test.ru', password: 'Test123!', name: 'Иван Тестов', phone: '+7 900 000-00-02', role: 'customer' },
];

const CATEGORIES = [
  { name: 'Шаурма', slug: 'shawarma', sort: 1 },
  { name: 'Донер', slug: 'doner', sort: 2 },
  { name: 'Закуски', slug: 'snacks', sort: 3 },
  { name: 'Соусы', slug: 'sauces', sort: 4 },
  { name: 'Напитки', slug: 'drinks', sort: 5 },
];

// [categorySlug, name, description, price, weight, spicy, emoji]
const PRODUCTS = [
  ['shawarma', 'Шаурма классическая', 'Курица, капуста, огурец, помидор, чесночный соус', 280, 350, 0, '🌯'],
  ['shawarma', 'Шаурма с говядиной', 'Говядина, свежие овощи, соус на выбор', 340, 370, 0, '🌯'],
  ['shawarma', 'Шаурма острая', 'Курица, халапеньо, острый соус, лук', 300, 350, 1, '🌶️'],
  ['shawarma', 'Шаурма сырная', 'Курица, двойной сыр, соус чесночный', 320, 380, 0, '🧀'],
  ['shawarma', 'Шаурма XXL', 'Двойная порция мяса, всё в двойном объёме', 450, 600, 0, '💪'],
  ['shawarma', 'Шаурма вегетарианская', 'Фалафель, овощи, соус тахини', 260, 330, 0, '🥗'],
  ['doner', 'Донер в пите', 'Мясо, салат, соус, подаётся в пите', 290, 320, 0, '🥙'],
  ['doner', 'Донер с сыром', 'Мясо, сыр, овощи, белый соус', 330, 340, 0, '🥙'],
  ['snacks', 'Картофель фри', 'Хрустящий картофель, соль', 150, 150, 0, '🍟'],
  ['snacks', 'Наггетсы (6 шт.)', 'Куриные наггетсы в панировке', 190, 180, 0, '🍗'],
  ['snacks', 'Луковые кольца', '8 колец в кляре', 170, 160, 0, '🧅'],
  ['sauces', 'Соус чесночный', 'Порция 50 г', 40, 50, 0, '🥣'],
  ['sauces', 'Соус острый', 'Порция 50 г', 40, 50, 1, '🔥'],
  ['sauces', 'Соус сырный', 'Порция 50 г', 50, 50, 0, '🧀'],
  ['drinks', 'Кола 0.5', 'Классическая кола', 120, 500, 0, '🥤'],
  ['drinks', 'Айран 0.5', 'Кисломолочный напиток', 100, 500, 0, '🥛'],
  ['drinks', 'Чай чёрный', 'Горячий чай 300 мл', 80, 300, 0, '🍵'],
  ['drinks', 'Морс клюквенный', 'Домашний морс 400 мл', 110, 400, 0, '🧃'],
];

const EXTRAS = [
  ['Двойное мясо', 120],
  ['Дополнительный сыр', 50],
  ['Халапеньо', 30],
  ['Грибы', 60],
  ['Колбасный сыр', 40],
];

const PROMOCODES = [
  ['SHAWARMA10', 10, 1, null, 1000],
  ['FIRSTORDER', 15, 1, null, 500],
  ['SUMMER20', 20, 0, null, 500],
  ['EXPIRED5', 5, 1, '2024-01-01T00:00:00.000Z', 100],
];

export async function seedIfEmpty(db) {
  const existing = await db.get('SELECT COUNT(*) AS c FROM products');
  const count = existing ? Number(existing.c) : 0;
  if (count > 0) {
    return { seeded: false, products: count };
  }

  const now = new Date().toISOString();

  for (const user of DEMO_USERS) {
    await db.run(
      'INSERT INTO users (email, password_hash, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [user.email, hashPassword(user.password), user.name, user.phone, user.role, now]
    );
  }

  const categoryIds = {};
  for (const category of CATEGORIES) {
    const row = await db.get(
      'INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?) RETURNING id',
      [category.name, category.slug, category.sort]
    );
    categoryIds[category.slug] = row.id;
  }

  const images = {
    'Шаурма классическая': 'shawarma-classic.jpg',
    'Шаурма с говядиной': 'shawarma-beef.jpg',
    'Шаурма острая': 'shawarma-spicy.jpg',
    'Шаурма сырная': 'shawarma-cheese.jpg',
    'Шаурма XXL': 'shawarma-xxl.jpg',
    'Шаурма вегетарианская': 'shawarma-veg.jpg',
    'Донер в пите': 'doner-pita.jpg',
    'Донер с сыром': 'doner-cheese.jpg',
    'Картофель фри': 'fries.jpg',
    'Наггетсы (6 шт.)': 'nuggets.jpg',
    'Луковые кольца': 'onion-rings.jpg',
    'Соус чесночный': 'sauce-garlic.jpg',
    'Соус острый': 'sauce-spicy.jpg',
    'Соус сырный': 'sauce-cheese.jpg',
    'Кола 0.5': 'cola.jpg',
    'Айран 0.5': 'ayran.jpg',
    'Чай чёрный': 'tea.jpg',
    'Морс клюквенный': 'morse.jpg',
  };

  for (const product of PRODUCTS) {
    const imageFile = images[product[1]];
    await db.run(
      'INSERT INTO products (category_id, name, description, price, weight_g, is_spicy, is_available, emoji, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        categoryIds[product[0]],
        product[1],
        product[2],
        product[3],
        product[4],
        product[5],
        1,
        product[6],
        imageFile ? '/images/menu/' + imageFile : null,
        now,
      ]
    );
  }

  for (const extra of EXTRAS) {
    await db.run('INSERT INTO extras (name, price, is_available) VALUES (?, ?, ?)', [extra[0], extra[1], 1]);
  }

  for (const promo of PROMOCODES) {
    await db.run(
      'INSERT INTO promocodes (code, discount_percent, is_active, valid_until, usage_limit, used_count) VALUES (?, ?, ?, ?, ?, ?)',
      [promo[0], promo[1], promo[2], promo[3], promo[4], 0]
    );
  }

  return { seeded: true, products: PRODUCTS.length };
}
