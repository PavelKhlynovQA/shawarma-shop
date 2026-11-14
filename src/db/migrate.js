// Лёгкие миграции для уже созданных баз: добавляем недостающие колонки.
const COLUMNS = [
  ['orders', 'payment_status', "TEXT NOT NULL DEFAULT 'PENDING'"],
  ['orders', 'paid_at', 'TEXT'],
  ['orders', 'card_last4', 'TEXT'],
  ['products', 'image_url', 'TEXT'],
];

// Соответствие «название товара → файл иллюстрации в public/images/menu».
const PRODUCT_IMAGES = {
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

export async function migrate(db) {
  const applied = [];

  for (const entry of COLUMNS) {
    const table = entry[0];
    const column = entry[1];
    const definition = entry[2];
    try {
      await db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + column + ' ' + definition);
      applied.push(table + '.' + column);
    } catch (error) {
      // колонка уже есть — пропускаем
    }
  }

  for (const entry of Object.entries(PRODUCT_IMAGES)) {
    try {
      await db.run('UPDATE products SET image_url = ? WHERE name = ? AND (image_url IS NULL OR image_url = \'\')', [
        '/images/menu/' + entry[1],
        entry[0],
      ]);
    } catch (error) {
      // таблицы products может ещё не быть
    }
  }

  return applied;
}
