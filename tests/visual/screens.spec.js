import { test, expect } from '@playwright/test';
import { StorefrontPage } from '../e2e/pages/StorefrontPage.js';
import { AdminPage } from '../e2e/pages/AdminPage.js';
import { PRODUCTS, EXTRAS } from '../e2e/helpers.js';

/** Убирает динамические элементы (тосты), чтобы снапшоты были стабильны. */
async function hideDynamic(page) {
  await page.addStyleTag({ content: '.toasts { display: none !important; }' });
  await page.waitForTimeout(250);
}

/**
 * Визуальные тесты. Экраны подобраны так, чтобы не содержать
 * динамических данных (номеров заказов, времени, счётчиков статистики).
 */
test.describe('Визуальная регрессия', function () {
  test('VIS-01: витрина', async function ({ page }) {
    const store = new StorefrontPage(page);
    await store.open();
    await hideDynamic(page);
    await page.waitForTimeout(400); // дать шрифтам догрузиться

    await expect(page).toHaveScreenshot('storefront.png');
  });

  test('VIS-02: модальное окно товара', async function ({ page }) {
    const store = new StorefrontPage(page);
    await store.open();
    await store.openProduct(PRODUCTS.classic.name);
    await hideDynamic(page);

    await expect(page.locator('#productModalBody')).toHaveScreenshot('product-modal.png');
  });

  test('VIS-03: корзина с двумя позициями', async function ({ page }) {
    const store = new StorefrontPage(page);
    await store.open();
    await store.resetCart();

    await store.addToCart(PRODUCTS.classic.name, { quantity: 2, extras: [EXTRAS.doubleMeat.name] });
    await store.addToCart(PRODUCTS.cola.name);

    const cart = await store.openCart();
    await hideDynamic(page);

    await expect(cart.root).toHaveScreenshot('cart-drawer.png');
  });

  test('VIS-04: форма оформления заказа', async function ({ page }) {
    const store = new StorefrontPage(page);
    await store.open();
    await store.resetCart();

    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();
    await hideDynamic(page);

    await expect(checkout.root).toHaveScreenshot('checkout-form.png');
  });

  test('VIS-05: страница входа в админку', async function ({ page }) {
    const admin = new AdminPage(page);
    await admin.openWithCleanSession();
    await hideDynamic(page);

    await expect(page.locator('.login-box')).toHaveScreenshot('admin-login.png');
  });
});
