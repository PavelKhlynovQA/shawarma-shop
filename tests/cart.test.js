import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { startTestServer } from './helpers/test-server.js';

let server;

before(async function () {
  server = await startTestServer();
});

after(async function () { if (server) await server.close(); });

function newCartId() {
  return crypto.randomBytes(16).toString('hex');
}

async function call(method, path, options) {
  const opts = options || {};
  const headers = { 'X-Cart-Id': opts.cartId || '' };
  if (opts.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(server.url + path, {
    method: method,
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (error) { body = text; }
  return { status: res.status, body: body, cartHeader: res.headers.get('X-Cart-Id') };
}

// ---------- Получение корзины ----------

test('GET /api/cart создаёт корзину и возвращает пустой список', async function () {
  const res = await call('GET', '/api/cart', { cartId: newCartId() });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.cart.items, []);
  assert.equal(res.body.cart.subtotal, 0);
  assert.equal(res.body.cart.count, 0);
});

test('GET /api/cart без заголовка возвращает новый X-Cart-Id', async function () {
  const res = await call('GET', '/api/cart');
  assert.equal(res.status, 200);
  assert.ok(res.cartHeader, 'ожидается заголовок X-Cart-Id');
  assert.equal(res.body.cart.id, res.cartHeader);
});

test('корзины с разными X-Cart-Id не смешиваются', async function () {
  const first = newCartId();
  const second = newCartId();
  await call('POST', '/api/cart/items', { cartId: first, body: { productId: 1, quantity: 1 } });
  const secondCart = await call('GET', '/api/cart', { cartId: second });
  assert.equal(secondCart.body.cart.items.length, 0);
});

// ---------- Добавление ----------

test('POST /api/cart/items добавляет товар и считает сумму', async function () {
  const cartId = newCartId();
  const res = await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 2 } });
  assert.equal(res.status, 201);
  assert.equal(res.body.cart.items.length, 1);
  assert.equal(res.body.cart.items[0].quantity, 2);
  assert.equal(res.body.cart.items[0].unitPrice, 280);
  assert.equal(res.body.cart.subtotal, 560);
  assert.equal(res.body.cart.count, 2);
});

test('POST /api/cart/items учитывает цену дополнителей', async function () {
  const cartId = newCartId();
  const res = await call('POST', '/api/cart/items', {
    cartId: cartId, body: { productId: 1, quantity: 1, extras: [1, 2] },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.cart.items[0].unitPrice, 280 + 120 + 50);
  assert.equal(res.body.cart.subtotal, 450);
});

test('повторное добавление того же товара с теми же дополнителями увеличивает количество', async function () {
  const cartId = newCartId();
  await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 1, extras: [1] } });
  const res = await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 2, extras: [1] } });
  assert.equal(res.body.cart.items.length, 1);
  assert.equal(res.body.cart.items[0].quantity, 3);
});

test('тот же товар с другим набором дополнителей создаёт отдельную позицию', async function () {
  const cartId = newCartId();
  await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 1 } });
  const res = await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 1, extras: [1] } });
  assert.equal(res.body.cart.items.length, 2);
});

// ---------- Отклонения ----------

test('количество 0 отклоняется с 400 VALIDATION_ERROR', async function () {
  const res = await call('POST', '/api/cart/items', { cartId: newCartId(), body: { productId: 1, quantity: 0 } });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(res.body.error.details[0].field, 'quantity');
});

test('количество 21 отклоняется как превышающее лимит', async function () {
  const res = await call('POST', '/api/cart/items', { cartId: newCartId(), body: { productId: 1, quantity: 21 } });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.details[0].field, 'quantity');
});

test('несуществующий товар возвращает 404 NOT_FOUND', async function () {
  const res = await call('POST', '/api/cart/items', { cartId: newCartId(), body: { productId: 9999 } });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('несуществующий дополнитель возвращает 400 с полем extras', async function () {
  const res = await call('POST', '/api/cart/items', {
    cartId: newCartId(), body: { productId: 1, extras: [999] },
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.details[0].field, 'extras');
});

// ---------- Изменение и удаление ----------

test('PATCH /api/cart/items/:id меняет количество и сумму', async function () {
  const cartId = newCartId();
  const created = await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 1 } });
  const itemId = created.body.cart.items[0].id;

  const res = await call('PATCH', '/api/cart/items/' + itemId, { cartId: cartId, body: { quantity: 3 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.cart.items[0].quantity, 3);
  assert.equal(res.body.cart.subtotal, 840);
});

test('PATCH с количеством 0 удаляет позицию', async function () {
  const cartId = newCartId();
  const created = await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 1 } });
  const itemId = created.body.cart.items[0].id;

  const res = await call('PATCH', '/api/cart/items/' + itemId, { cartId: cartId, body: { quantity: 0 } });
  assert.equal(res.status, 200);
  assert.equal(res.body.cart.items.length, 0);
  assert.equal(res.body.cart.count, 0);
});

test('PATCH чужой позиции возвращает 404', async function () {
  const res = await call('PATCH', '/api/cart/items/999999', { cartId: newCartId(), body: { quantity: 1 } });
  assert.equal(res.status, 404);
});

test('DELETE /api/cart/items/:id удаляет позицию', async function () {
  const cartId = newCartId();
  const created = await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 2 } });
  const itemId = created.body.cart.items[0].id;

  const res = await call('DELETE', '/api/cart/items/' + itemId, { cartId: cartId });
  assert.equal(res.status, 200);
  assert.equal(res.body.cart.items.length, 0);
});

test('DELETE /api/cart очищает корзину целиком', async function () {
  const cartId = newCartId();
  await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 1, quantity: 1 } });
  await call('POST', '/api/cart/items', { cartId: cartId, body: { productId: 2, quantity: 1 } });

  const res = await call('DELETE', '/api/cart', { cartId: cartId });
  assert.equal(res.status, 200);
  assert.equal(res.body.cart.items.length, 0);
  assert.equal(res.body.cart.subtotal, 0);
});
