import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, jsonCall } from './helpers/test-server.js';

let server;
let adminToken;

before(async function () {
  server = await startTestServer();
  const login = await jsonCall(server.url, 'POST', '/api/auth/login', {
    email: 'admin@shawarma.ru',
    password: 'Admin123!',
  });
  adminToken = login.body.token;
});

after(async function () { if (server) await server.close(); });

function validOrder(overrides) {
  return Object.assign({
    customerName: 'Иван Тестов',
    phone: '+7 900 123-45-67',
    deliveryType: 'delivery',
    address: 'Волгоград, ул. Мира, 15',
    items: [{ productId: 1, quantity: 2 }],
  }, overrides || {});
}

// ---------- Аутентификация ----------

test('логин с верными данными возвращает токен', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/auth/login', {
    email: 'admin@shawarma.ru', password: 'Admin123!',
  });
  assert.equal(response.status, 200);
  assert.ok(response.body.token);
  assert.equal(response.body.user.role, 'admin');
});

test('логин с неверным паролем возвращает 401 INVALID_CREDENTIALS', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/auth/login', {
    email: 'admin@shawarma.ru', password: 'wrong-pass',
  });
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
});

test('регистрация с некорректным email возвращает 400', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/auth/register', {
    email: 'not-an-email', password: '123456', name: 'Тест',
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.ok(response.body.error.details.some(function (d) { return d.field === 'email'; }));
});

test('повторная регистрация на занятый email возвращает 409 EMAIL_TAKEN', async function () {
  const email = 'unique' + Date.now() + '@test.ru';
  const first = await jsonCall(server.url, 'POST', '/api/auth/register', {
    email: email, password: '123456', name: 'Тест',
  });
  assert.equal(first.status, 201);

  const second = await jsonCall(server.url, 'POST', '/api/auth/register', {
    email: email, password: '123456', name: 'Тест',
  });
  assert.equal(second.status, 409);
  assert.equal(second.body.error.code, 'EMAIL_TAKEN');
});

// ---------- Заказы ----------

test('создание заказа считает сумму, скидку и возвращает номер', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/orders', validOrder({ promoCode: 'SHAWARMA10' }));
  assert.equal(response.status, 201);

  const order = response.body.order;
  assert.match(order.publicId, /^SH-\d{6}-[0-9A-F]{4}$/);
  assert.equal(order.status, 'NEW');
  assert.equal(order.subtotal, 560);
  assert.equal(order.discount, 56);
  assert.equal(order.total, 504);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].lineTotal, 560);
  assert.equal(order.history.length, 1);
});

test('заказ с доставкой ниже 500 ₽ отклоняется с кодом MIN_ORDER_AMOUNT', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/orders', validOrder({
    items: [{ productId: 12, quantity: 1 }],
  }));
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'MIN_ORDER_AMOUNT');
});

test('самовывоз позволяет заказ ниже минимальной суммы', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/orders', validOrder({
    deliveryType: 'pickup',
    address: '',
    items: [{ productId: 12, quantity: 1 }],
  }));
  assert.equal(response.status, 201);
  assert.equal(response.body.order.total, 40);
});

test('пустая корзина возвращает 400', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/orders', validOrder({ items: [] }));
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('некорректный телефон возвращает 400 с указанием поля', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/orders', validOrder({ phone: 'abc' }));
  assert.equal(response.status, 400);
  assert.ok(response.body.error.details.some(function (d) { return d.field === 'phone'; }));
});

test('несуществующий товар возвращает 400', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/orders', validOrder({
    items: [{ productId: 9999, quantity: 1 }],
  }));
  assert.equal(response.status, 400);
});

test('прослеживание заказа по publicId работает', async function () {
  const created = await jsonCall(server.url, 'POST', '/api/orders', validOrder());
  const publicId = created.body.order.publicId;

  const response = await jsonCall(server.url, 'GET', '/api/orders/' + publicId);
  assert.equal(response.status, 200);
  assert.equal(response.body.order.publicId, publicId);
});

test('несуществующий заказ возвращает 404', async function () {
  const response = await jsonCall(server.url, 'GET', '/api/orders/SH-000000-0000');
  assert.equal(response.status, 404);
});

// ---------- Промокоды ----------

test('просроченный промокод возвращает 409 PROMO_EXPIRED', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/promo/validate', { code: 'EXPIRED5', subtotal: 1000 });
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'PROMO_EXPIRED');
});

test('неактивный промокод возвращает 409 PROMO_INACTIVE', async function () {
  const response = await jsonCall(server.url, 'POST', '/api/promo/validate', { code: 'SUMMER20', subtotal: 1000 });
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'PROMO_INACTIVE');
});

// ---------- Админка ----------

test('админские методы без токена возвращают 401', async function () {
  const response = await jsonCall(server.url, 'GET', '/api/admin/orders');
  assert.equal(response.status, 401);
});

test('админские методы с токеном покупателя возвращают 403', async function () {
  const login = await jsonCall(server.url, 'POST', '/api/auth/login', {
    email: 'customer@test.ru', password: 'Test123!',
  });
  const response = await jsonCall(server.url, 'GET', '/api/admin/orders', undefined, login.body.token);
  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
});

test('смена статуса по допустимому маршруту работает', async function () {
  const created = await jsonCall(server.url, 'POST', '/api/orders', validOrder());
  const id = created.body.order.publicId;

  const list = await jsonCall(server.url, 'GET', '/api/admin/orders', undefined, adminToken);
  const order = list.body.orders.find(function (o) { return o.publicId === id; });

  const response = await jsonCall(server.url, 'PATCH', '/api/admin/orders/' + order.id + '/status', { status: 'CONFIRMED' }, adminToken);
  assert.equal(response.status, 200);
  assert.equal(response.body.order.status, 'CONFIRMED');
});

test('недопустимый переход статуса возвращает 409 INVALID_STATUS_TRANSITION', async function () {
  const created = await jsonCall(server.url, 'POST', '/api/orders', validOrder());
  const publicId = created.body.order.publicId;

  const list = await jsonCall(server.url, 'GET', '/api/admin/orders', undefined, adminToken);
  const order = list.body.orders.find(function (o) { return o.publicId === publicId; });

  const response = await jsonCall(server.url, 'PATCH', '/api/admin/orders/' + order.id + '/status', { status: 'DONE' }, adminToken);
  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'INVALID_STATUS_TRANSITION');
});

test('статистика отдаёт число заказов и выручку', async function () {
  const response = await jsonCall(server.url, 'GET', '/api/admin/stats', undefined, adminToken);
  assert.equal(response.status, 200);
  assert.ok(response.body.stats.ordersTotal > 0);
  assert.ok(typeof response.body.stats.revenue === 'number');
});
