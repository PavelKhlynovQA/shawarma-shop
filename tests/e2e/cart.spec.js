import { test, expect } from '@playwright/test';
import { openStore, addToCart, openCart, PRODUCTS, EXTRAS } from './helpers.js';

test.describe('Корзина', function () {
  test.beforeEach(async function ({ page }) {
    await openStore(page);
    await page.evaluate(function () { localStorage.clear(); });
    await page.reload();
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('E2E-10: добавление товара увеличивает счётчик корзины', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name);
    await expect(page.locator('#cartCount')).toHaveText('1');

    await addToCart(page, PRODUCTS.classic.name);
    await expect(page.locator('#cartCount')).toHaveText('2');
  });

  test('E2E-11: товар с дополнителями считается по формуле (товар + допы) × количество', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, {
      extras: [EXTRAS.doubleMeat.name, EXTRAS.cheese.name],
    });

    await openCart(page);
    // 280 + 120 + 50 = 450
    await expect(page.locator('.cart-row__price')).toHaveText('450 ₽');
    await expect(page.locator('.cart-row__sub')).toContainText('Двойное мясо');
  });

  test('E2E-12: изменение количества пересчитывает сумму', async function ({ page }) {
    await addToCart(page, PRODUCTS.beef.name, { quantity: 3 });
    await openCart(page);

    await expect(page.locator('.cart-row .qty span')).toHaveText('3');
    await expect(page.locator('.cart-row__price')).toHaveText('1 020 ₽');
  });

  test('E2E-13: уменьшение количества до нуля удаляет позицию', async function ({ page }) {
    await addToCart(page, PRODUCTS.cola.name);
    await openCart(page);

    await page.locator('[data-dec]').click();
    await expect(page.locator('#cartItems')).toContainText('Корзина пуста');
    await expect(page.locator('#cartCount')).toHaveText('0');
  });

  test('E2E-14: кнопка «Удалить» очищает позицию', async function ({ page }) {
    await addToCart(page, PRODUCTS.cola.name);
    await addToCart(page, PRODUCTS.morse.name);
    await openCart(page);

    await expect(page.locator('.cart-row')).toHaveCount(2);
    await page.locator('[data-del]').first().click();
    await expect(page.locator('.cart-row')).toHaveCount(1);
  });

  test('E2E-15: корзина сохраняется после перезагрузки страницы', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name);
    await page.reload();
    await expect(page.locator('#cartCount')).toHaveText('1');

    await openCart(page);
    await expect(page.locator('.cart-row')).toHaveCount(1);
  });

  test('E2E-16: разные наборы дополнителей — разные позиции', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { extras: [EXTRAS.cheese.name] });
    await addToCart(page, PRODUCTS.classic.name);

    await openCart(page);
    await expect(page.locator('.cart-row')).toHaveCount(2);
  });
});
