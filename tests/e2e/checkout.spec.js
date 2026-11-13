import { test, expect } from '@playwright/test';
import { StorefrontPage } from './pages/StorefrontPage.js';
import { PRODUCTS } from './helpers.js';

test.describe('Оформление заказа', function () {
  let store;

  test.beforeEach(async function ({ page }) {
    store = new StorefrontPage(page);
    await store.open();
    await store.resetCart();
  });

  test('E2E-20: пустая корзина не даёт оформить заказ', async function () {
    const cart = await store.openCart();
    await expect(cart.emptyText).toBeVisible();
    await expect(cart.checkoutButton).toHaveCount(0);
  });

  test('E2E-21: пустое имя отклоняется с ошибкой валидации', async function ({ page }) {
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.fill({ customerName: '' });
    await checkout.submit();

    await expect(page.locator('.toast--error')).toContainText('customerName');
    await expect(checkout.form).toBeVisible();
  });

  test('E2E-22: некорректный телефон отклоняется', async function ({ page }) {
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.fill({ phone: 'abc' });
    await checkout.submit();

    await expect(page.locator('.toast--error')).toContainText('phone');
  });

  test('E2E-23: доставка дешевле 500 ₽ блокируется', async function ({ page }) {
    await store.addToCart(PRODUCTS.sauce.name);
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.fill({ deliveryType: 'delivery' });
    await checkout.submit();

    await expect(page.locator('.toast--error')).toContainText('Минимальная сумма заказа с доставкой');
  });

  test('E2E-24: успешный заказ с доставкой показывает номер и статус', async function () {
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.fill();
    await checkout.submit();

    await expect(checkout.successId).toHaveText(/^SH-\d{6}-[0-9A-F]{4}$/);
    await expect(checkout.statusLine).toContainText('NEW');
    await expect(checkout.success).toContainText('560 ₽');
  });

  test('E2E-25: самовывоз без адреса проходит успешно', async function () {
    await store.addToCart(PRODUCTS.sauce.name);
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.fill({ deliveryType: 'pickup' });
    await checkout.submit();

    await expect(checkout.successId).toBeVisible();
    await expect(checkout.success).toContainText('40 ₽');
  });

  test('E2E-26: промокод уменьшает итоговую сумму', async function ({ page }) {
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.applyPromo('SHAWARMA10');

    await expect(page.locator('.toast', { hasText: 'Промокод' })).toContainText('−56 ₽');
    await expect(checkout.total).toHaveText('504 ₽');

    await checkout.fill();
    await checkout.submit();
    await expect(checkout.success).toContainText('504 ₽');
  });

  test('E2E-27: неверный промокод показывает ошибку', async function ({ page }) {
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.applyPromo('NOPE123');

    await expect(page.locator('.toast--error')).toBeVisible();
    await expect(checkout.total).toHaveText('560 ₽');
  });

  test('E2E-28: после успешного заказа корзина очищается', async function () {
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();

    await checkout.fill();
    await checkout.submit();
    await checkout.expectSuccess();

    await expect(store.cartCount).toHaveText('0');
  });

  test('E2E-29: адрес скрывается при выборе самовывоза', async function () {
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();

    await expect(checkout.addressField).toBeVisible();

    await checkout.field('deliveryType').selectOption('pickup');
    await expect(checkout.addressField).toBeHidden();

    await checkout.field('deliveryType').selectOption('delivery');
    await expect(checkout.addressField).toBeVisible();
  });
});
