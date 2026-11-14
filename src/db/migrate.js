// Лёгкие миграции для уже созданных баз: добавляем недостающие колонки.
const COLUMNS = [
  ['orders', 'payment_status', "TEXT NOT NULL DEFAULT 'PENDING'"],
  ['orders', 'paid_at', 'TEXT'],
  ['orders', 'card_last4', 'TEXT'],
];

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

  return applied;
}
