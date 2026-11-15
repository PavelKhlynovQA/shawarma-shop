// Детализированные тест-кейсы: проверки базы данных (DBeaver / psql).
export const DETAILED_DB = [
  {
    id: 'TC-DB-01', module: 'Схема', priority: 'Высокий', title: 'Создание всех таблиц при старте',
    requirement: 'FR-01', automation: 'docker-smoke.mjs',
    preconditions: ['Docker-стек поднят: docker compose up -d', 'Подключение в DBeaver: localhost:5432, shawarma/shawarma'],
    steps: [
      { action: 'Выполнить: SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name;', expected: '9 строк: categories, extras, order_items, order_status_history, orders, otp_codes, products, promocodes, users' },
      { action: 'Проверить обязательные колонки products', expected: 'id, category_id, name, price, is_available, image_url, emoji, created_at' },
      { action: 'Проверить колонки orders', expected: 'public_id, status, payment_status, paid_at, card_last4, subtotal, discount, total' },
      { action: 'Проверить индексы: SELECT indexname FROM pg_indexes WHERE schemaname = \'public\';', expected: 'Присутствуют idx_products_category, idx_orders_user, idx_orders_created, idx_items_order, idx_otp_phone' },
    ],
  },
  {
    id: 'TC-DB-02', module: 'Заказы', priority: 'Высокий', title: 'Сумма заказа совпадает с суммой позиций',
    requirement: 'FR-06', automation: 'ручная проверка',
    preconditions: ['Есть минимум один заказ с позициями'],
    steps: [
      { action: 'Выполнить: SELECT o.public_id, o.subtotal, SUM(i.line_total) AS calc FROM orders o JOIN order_items i ON i.order_id = o.id GROUP BY o.id, o.public_id, o.subtotal HAVING o.subtotal <> SUM(i.line_total);', expected: 'Запрос возвращает 0 строк — расхождений нет' },
      { action: 'Проверить на конкретном заказе', expected: 'Для SH-261114-8D5C: subtotal = 560, SUM(line_total) = 560' },
      { action: 'Проверить формулу строки', expected: 'line_total = (price + сумма допов) × quantity' },
    ],
  },
  {
    id: 'TC-DB-03', module: 'Заказы', priority: 'Высокий', title: 'Итог заказа равен subtotal минус скидка',
    requirement: 'FR-06', automation: 'ручная проверка',
    preconditions: ['Есть заказы со скидкой и без'],
    steps: [
      { action: 'Выполнить: SELECT public_id, subtotal, discount, total FROM orders WHERE total <> subtotal - discount;', expected: '0 строк' },
      { action: 'Проверить заказ с промокодом', expected: 'subtotal 560, discount 56, total 504 (10% с округлением вниз)' },
      { action: 'Проверить тип данных', expected: 'Все три поля — целые числа, без копеек' },
    ],
  },
  {
    id: 'TC-DB-04', module: 'Статусы', priority: 'Высокий', title: 'Статус заказа совпадает с последней записью истории',
    requirement: 'FR-12', automation: 'ручная проверка',
    preconditions: ['По заказу были смены статуса'],
    steps: [
      { action: 'Выполнить: SELECT o.id, o.status FROM orders o JOIN order_status_history h ON h.order_id = o.id AND h.id = (SELECT MAX(id) FROM order_status_history WHERE order_id = o.id) WHERE o.status <> h.status;', expected: '0 строк — статус и история согласованы' },
      { action: 'Проверить количество записей истории', expected: 'Для заказа с 3 переходами — 3 записи: NEW, CONFIRMED, COOKING' },
      { action: 'Проверить хронологию', expected: 'created_at записей возрастает, latest = orders.updated_at' },
    ],
  },
  {
    id: 'TC-DB-05', module: 'Промокоды', priority: 'Средний', title: 'Счётчик использований промокода увеличивается',
    requirement: 'FR-08', automation: 'ручная проверка',
    preconditions: ['Промокод SHAWARMA10 с used_count = N'],
    steps: [
      { action: 'Зафиксировать: SELECT code, used_count FROM promocodes WHERE code = \'SHAWARMA10\';', expected: 'Например, used_count = 5' },
      { action: 'Создать заказ с этим промокодом через UI', expected: 'Заказ создан успешно' },
      { action: 'Повторить запрос', expected: 'used_count = 6, то есть увеличился ровно на 1' },
      { action: 'Проверить лимит', expected: 'При used_count >= usage_limit заказ отклоняется с PROMO_LIMIT_EXCEEDED' },
    ],
  },
  {
    id: 'TC-DB-06', module: 'Оплата', priority: 'Высокий', title: 'Результат оплаты сохраняется в заказе',
    requirement: 'FR-09', automation: 'ручная проверка',
    preconditions: ['Заказ оплачен картой 4111…1111'],
    steps: [
      { action: 'Выполнить: SELECT public_id, payment_status, card_last4, paid_at FROM orders ORDER BY id DESC LIMIT 1;', expected: 'payment_status = PAID, card_last4 = 1111, paid_at заполнен ISO-датой' },
      { action: 'Проверить заказ с отказом банка', expected: 'payment_status = PENDING, paid_at IS NULL, card_last4 IS NULL' },
      { action: 'Проверить номер карты', expected: 'Полный номер не хранится — только последние 4 цифры' },
    ],
  },
  {
    id: 'TC-DB-07', module: 'Авторизация', priority: 'Средний', title: 'Одноразовый код помечается использованным',
    requirement: 'FR-05', automation: 'ручная проверка',
    preconditions: ['Запрошен код для номера +79007776655'],
    steps: [
      { action: 'Выполнить: SELECT phone, code, attempts, used, expires_at FROM otp_codes WHERE phone = \'79007776655\' ORDER BY id DESC LIMIT 1;', expected: 'used = 0, attempts = 0, expires_at на 5 минут позже created_at' },
      { action: 'Ввести неверный код в UI', expected: 'attempts становится 1, used остаётся 0' },
      { action: 'Ввести верный код', expected: 'used = 1, повторный вход по этому же коду невозможен' },
      { action: 'Проверить истечение', expected: 'Код старше 5 минут даёт OTP_EXPIRED' },
    ],
  },
  {
    id: 'TC-DB-08', module: 'Меню', priority: 'Средний', title: 'Мягкое удаление товара сохраняет историю',
    requirement: 'FR-13', automation: 'E2E-35',
    preconditions: ['Товар «Морс клюквенный» (id = 18) скрыт через админку'],
    steps: [
      { action: 'Выполнить: SELECT id, name, is_available FROM products WHERE id = 18;', expected: 'Строка существует, is_available = 0' },
      { action: 'Проверить наличие в старых заказах: SELECT COUNT(*) FROM order_items WHERE product_id = 18;', expected: 'Счётчик больше 0 — позиции сохранены' },
      { action: 'Проверить витрину', expected: 'GET /api/menu не содержит товар 18' },
      { action: 'Вернуть товар через админку', expected: 'is_available = 1, товар снова в GET /api/menu' },
    ],
  },
];
