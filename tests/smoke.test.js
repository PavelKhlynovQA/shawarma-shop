import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, jsonCall } from './helpers/test-server.js';

let server;

before(async function () { server = await startTestServer(); });
after(async function () { if (server) await server.close(); });

test('GET /api/health отвечает 200 и статусом ok', async function () {
  const response = await jsonCall(server.url, 'GET', '/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.dbDriver, 'sqlite');
});

test('GET /api/menu возвращает непустой список категорий', async function () {
  const response = await jsonCall(server.url, 'GET', '/api/menu');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.categories));
  assert.ok(response.body.categories.length > 0);

  const totalProducts = response.body.categories.reduce(function (sum, category) {
    return sum + category.products.length;
  }, 0);
  assert.ok(totalProducts >= 10, 'в меню должно быть не меньше 10 товаров');
});

test('GET /api/extras возвращает дополнительные ингредиенты', async function () {
  const response = await jsonCall(server.url, 'GET', '/api/extras');
  assert.equal(response.status, 200);
  assert.ok(response.body.extras.length > 0);
});

test('несуществующий маршрут возвращает 404 в едином формате ошибки', async function () {
  const response = await jsonCall(server.url, 'GET', '/api/nothing-here');
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'ROUTE_NOT_FOUND');
});
