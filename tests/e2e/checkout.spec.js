import { test, expect } from '@playwright/test';
import { openStore, addToCart, openCart, goToCheckout, fillCheckoutForm, submitCheckout, PRODUCTS } from './helpers.js';

test.describe('Оформление заказа', function () {
  test.beforeEach(async function ({ page }) {
    await openStore(page);
    await page.evaluate(function () { localStorage.clear(); });
    await page.reload();
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('E2E-20: пустая корзина не даёт оформить заказ', async function ({ page }) {
    await openCart(page);
    await expect(page.locator('#cartItems')).toContainText('Корзина пуста');
    await expect(page.locator('#goCheckout')).toHaveCount(0);
  });

  test('E2E-21: пустое имя отклоняется с ошибкой валидации', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { quantity: 2 });
    await goToCheckout(page);
    await fillCheckoutForm(page, { customerName: '' });
    await submitCheckout(page);

    await expect(page.locator('.toast--error')).toContainText('customerName');
    await expect(page.locator('#checkoutForm')).toBeVisible();
  });

  test('E2E-22: некорректный телефон отклоняется', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { quantity: 2 });
    await goToCheckout(page);
    await fillCheckoutForm(page, { phone: 'abc' });
    await submitCheckout(page);

    await expect(page.locator('.toast--error')).toContainText('phone');
  });

  test('E2E-23: доставка дешевле 500 ₽ блокируется', async function ({ page }) {
    await addToCart(page, PRODUCTS.sauce.name);
    await goToCheckout(page);
    await fillCheckoutForm(page, { deliveryType: 'delivery' });
    await submitCheckout(page);

    await expect(page.locator('.toast--error')).toContainText('Минимальная сумма заказа с доставкой');
  });

  test('E2E-24: успешный заказ с доставкой показывает номер и статус', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { quantity: 2 });
    await goToCheckout(page);
    await fillCheckoutForm(page);
    await submitCheckout(page);

    await expect(page.locator('.success__id')).toHaveText(/^SH-\d{6}-[0-9A-F]{4}$/);
    await expect(page.locator('.status-line')).toContainText('NEW');
    await expect(page.locator('.success')).toContainText('560 ₽');
  });

  test('E2E-25: самовывоз без адреса проходит успешно', async function ({ page }) {
    await addToCart(page, PRODUCTS.sauce.name);
    await goToCheckout(page);
    await fillCheckoutForm(page, { deliveryType: 'pickup' });
    await submitCheckout(page);

    await expect(page.locator('.success__id')).toBeVisible();
    await expect(page.locator('.success')).toContainText('40 ₽');
  });

  test('E2E-26: промокод уменьшает итоговую сумму', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { quantity: 2 });
    await goToCheckout(page);

    await page.locator('#checkoutForm [name=promoCode]').fill('SHAWARMA10');
    await page.locator('#applyPromo').click();

    await expect(page.locator('.toast', { hasText: 'Промокод' })).toContainText('−56 ₽');
    await expect(page.locator('#checkoutTotal')).toHaveText('504 ₽');

    await fillCheckoutForm(page);
    await submitCheckout(page);
    await expect(page.locator('.success')).toContainText('504 ₽');
  });

  test('E2E-27: неверный промокод показывает ошибку', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { quantity: 2 });
    await goToCheckout(page);

    await page.locator('#checkoutForm [name=promoCode]').fill('NOPE123');
    await page.locator('#applyPromo').click();

    await expect(page.locator('.toast--error')).toBeVisible();
    await expect(page.locator('#checkoutTotal')).toHaveText('560 ₽');
  });

  test('E2E-28: после успешного заказа корзина очищается', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { quantity: 2 });
    await goToCheckout(page);
    await fillCheckoutForm(page);
    await submitCheckout(page);

    await expect(page.locator('.success__id')).toBeVisible();
    await expect(page.locator('#cartCount')).toHaveText('0');
  });

  test('E2E-29: адрес скрывается при выборе самовывоза', async function ({ page }) {
    await addToCart(page, PRODUCTS.classic.name, { quantity: 2 });
    await goToCheckout(page);

    await expect(page.locator('#addressField')).toBeVisible();
    await page.locator('#checkoutForm [name=deliveryType]').selectOption('pickup');
    await expect(page.locator('#addressField')).toBeHidden();

    await page.locator('#checkoutForm [name=deliveryType]').selectOption('delivery');
    await expect(page.locator('#addressField')).toBeVisible();
  });
});
