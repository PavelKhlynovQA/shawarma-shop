import { test, expect } from '@playwright/test';
import { StorefrontPage } from './pages/StorefrontPage.js';
import { PRODUCTS, EXTRAS } from './helpers.js';

test.describe('Корзина', function () {
  let store;

  test.beforeEach(async function ({ page }) {
    store = new StorefrontPage(page);
    await store.open();
    await store.resetCart();
  });

  test('E2E-10: добавление товара увеличивает счётчик корзины', async function () {
    await store.addToCart(PRODUCTS.classic.name);
    await expect(store.cartCount).toHaveText('1');

    await store.addToCart(PRODUCTS.classic.name);
    await expect(store.cartCount).toHaveText('2');
  });

  test('E2E-11: товар с дополнителями считается по формуле (товар + допы) × количество', async function () {
    await store.addToCart(PRODUCTS.classic.name, {
      extras: [EXTRAS.doubleMeat.name, EXTRAS.cheese.name],
    });

    const cart = await store.openCart();
    // 280 + 120 + 50 = 450
    await expect(cart.rows.locator('.cart-row__price')).toHaveText('450 ₽');
    await expect(cart.rows.locator('.cart-row__sub')).toContainText('Двойное мясо');
  });

  test('E2E-12: изменение количества пересчитывает сумму', async function () {
    await store.addToCart(PRODUCTS.beef.name, { quantity: 3 });

    const cart = await store.openCart();
    await expect(cart.rows.locator('.qty span')).toHaveText('3');
    await expect(cart.rows.locator('.cart-row__price')).toHaveText('1 020 ₽');
  });

  test('E2E-13: уменьшение количества до нуля удаляет позицию', async function () {
    await store.addToCart(PRODUCTS.cola.name);

    const cart = await store.openCart();
    await cart.decrement();

    await expect(cart.emptyText).toBeVisible();
    await expect(store.cartCount).toHaveText('0');
  });

  test('E2E-14: кнопка «Удалить» очищает позицию', async function () {
    await store.addToCart(PRODUCTS.cola.name);
    await store.addToCart(PRODUCTS.morse.name);

    const cart = await store.openCart();
    await expect(cart.rows).toHaveCount(2);

    await cart.remove();
    await expect(cart.rows).toHaveCount(1);
  });

  test('E2E-15: корзина сохраняется после перезагрузки страницы', async function ({ page }) {
    await store.addToCart(PRODUCTS.classic.name);

    await page.reload();
    await expect(store.cartCount).toHaveText('1');

    const cart = await store.openCart();
    await expect(cart.rows).toHaveCount(1);
  });

  test('E2E-16: разные наборы дополнителей — разные позиции', async function () {
    await store.addToCart(PRODUCTS.classic.name, { extras: [EXTRAS.cheese.name] });
    await store.addToCart(PRODUCTS.classic.name);

    const cart = await store.openCart();
    await expect(cart.rows).toHaveCount(2);
  });
});
