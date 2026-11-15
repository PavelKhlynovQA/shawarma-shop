// DDL-схема. Генерируется под конкретный диалект (PostgreSQL / SQLite).
// Все даты храним строкой ISO-8601 (TEXT) — одинаково работает в обеих СУБД.

export const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'COOKING', 'DELIVERING', 'DONE', 'CANCELLED'];

export function ddl(dialect) {
  const id = dialect === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

  return [
    'CREATE TABLE IF NOT EXISTS users (' +
      'id ' + id + ',' +
      'email TEXT NOT NULL UNIQUE,' +
      'password_hash TEXT NOT NULL,' +
      'name TEXT NOT NULL,' +
      'phone TEXT,' +
      "role TEXT NOT NULL DEFAULT 'customer'," +
      'created_at TEXT NOT NULL' +
    ')',

    'CREATE TABLE IF NOT EXISTS categories (' +
      'id ' + id + ',' +
      'name TEXT NOT NULL,' +
      'slug TEXT NOT NULL UNIQUE,' +
      'sort_order INTEGER NOT NULL DEFAULT 0' +
    ')',

    'CREATE TABLE IF NOT EXISTS products (' +
      'id ' + id + ',' +
      'category_id INTEGER NOT NULL REFERENCES categories(id),' +
      'name TEXT NOT NULL,' +
      'description TEXT,' +
      'price INTEGER NOT NULL,' +
      'weight_g INTEGER,' +
      'is_spicy INTEGER NOT NULL DEFAULT 0,' +
      'is_available INTEGER NOT NULL DEFAULT 1,' +
      'emoji TEXT,' +
      'image_url TEXT,' +
      'created_at TEXT NOT NULL' +
    ')',

    'CREATE TABLE IF NOT EXISTS extras (' +
      'id ' + id + ',' +
      'name TEXT NOT NULL,' +
      'price INTEGER NOT NULL,' +
      'is_available INTEGER NOT NULL DEFAULT 1' +
    ')',

    'CREATE TABLE IF NOT EXISTS promocodes (' +
      'id ' + id + ',' +
      'code TEXT NOT NULL UNIQUE,' +
      'discount_percent INTEGER NOT NULL,' +
      'is_active INTEGER NOT NULL DEFAULT 1,' +
      'valid_until TEXT,' +
      'usage_limit INTEGER,' +
      'used_count INTEGER NOT NULL DEFAULT 0' +
    ')',

    'CREATE TABLE IF NOT EXISTS orders (' +
      'id ' + id + ',' +
      'public_id TEXT NOT NULL UNIQUE,' +
      'user_id INTEGER REFERENCES users(id),' +
      'customer_name TEXT NOT NULL,' +
      'phone TEXT NOT NULL,' +
      'address TEXT,' +
      'comment TEXT,' +
      "delivery_type TEXT NOT NULL DEFAULT 'delivery'," +
      "status TEXT NOT NULL DEFAULT 'NEW'," +
      'subtotal INTEGER NOT NULL,' +
      'discount INTEGER NOT NULL DEFAULT 0,' +
      'total INTEGER NOT NULL,' +
      'promo_code TEXT,' +
      "payment_status TEXT NOT NULL DEFAULT 'PENDING'," +
      'paid_at TEXT,' +
      'card_last4 TEXT,' +
      'created_at TEXT NOT NULL,' +
      'updated_at TEXT NOT NULL' +
    ')',

    'CREATE TABLE IF NOT EXISTS order_items (' +
      'id ' + id + ',' +
      'order_id INTEGER NOT NULL REFERENCES orders(id),' +
      'product_id INTEGER,' +
      'name TEXT NOT NULL,' +
      'price INTEGER NOT NULL,' +
      'quantity INTEGER NOT NULL,' +
      'extras TEXT,' +
      'line_total INTEGER NOT NULL' +
    ')',

    'CREATE TABLE IF NOT EXISTS otp_codes (' +
      'id ' + id + ',' +
      'phone TEXT NOT NULL,' +
      'code TEXT NOT NULL,' +
      'expires_at TEXT NOT NULL,' +
      'attempts INTEGER NOT NULL DEFAULT 0,' +
      'used INTEGER NOT NULL DEFAULT 0,' +
      'created_at TEXT NOT NULL' +
    ')',

    'CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone)',

    'CREATE TABLE IF NOT EXISTS order_status_history (' +
      'id ' + id + ',' +
      'order_id INTEGER NOT NULL REFERENCES orders(id),' +
      'status TEXT NOT NULL,' +
      'note TEXT,' +
      'created_at TEXT NOT NULL' +
    ')',

    'CREATE TABLE IF NOT EXISTS carts (' +
      'id TEXT PRIMARY KEY,' +
      'created_at TEXT NOT NULL,' +
      'updated_at TEXT NOT NULL' +
    ')',

    'CREATE TABLE IF NOT EXISTS cart_items (' +
      'id ' + id + ',' +
      'cart_id TEXT NOT NULL REFERENCES carts(id),' +
      'product_id INTEGER NOT NULL REFERENCES products(id),' +
      'quantity INTEGER NOT NULL,' +
      'extras TEXT,' +
      'created_at TEXT NOT NULL,' +
      'updated_at TEXT NOT NULL' +
    ')',

    'CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id)',
  ];
}
