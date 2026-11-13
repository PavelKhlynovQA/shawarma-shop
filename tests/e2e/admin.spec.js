import { test, expect } from '@playwright/test';
import { loginAsAdmin, createOrderViaApi } from './helpers.js';

test.describe('Админ-панель', function () {
  test.beforeEach(async function ({ page }) {
    await page.goto('/admin');
    await page.evaluate(function () { localStorage.clear(); });
    await page.reload();
  });

  test('E2E-30: без авторизации показывается форма входа', async function ({ page }) {
    await expect(page.locator('.login-box')).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Вход для администратора' })).toBeVisible();
    await expect(page.locator('#logoutButton')).toBeHidden();
  });

  test('E2E-31: неверный пароль показывает ошибку', async function ({ page }) {
    await page.locator('#email').fill('admin@shawarma.ru');
    await page.locator('#password').fill('wrong-password');
    await page.locator('#loginButton').click();

    await expect(page.locator('.toast--error')).toContainText('Неверный email или пароль');
    await expect(page.locator('.login-box')).toBeVisible();
  });

  test('E2E-32: успешный вход открывает статистику и таблицу заказов', async function ({ page }) {
    await loginAsAdmin(page);

    await expect(page.locator('.stat')).toHaveCount(4);
    await expect(page.locator('h1')).toHaveText('Заказы');
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.locator('#logoutButton')).toBeVisible();
  });

  test('E2E-33: смена статуса заказа NEW → Подтверждён', async function ({ page, request }) {
    const order = await createOrderViaApi(request);
    await loginAsAdmin(page);

    const row = page.locator('tr', { hasText: order.publicId });
    await expect(row).toContainText('Новый');

    await row.locator('[data-status=CONFIRMED]').click();
    await expect(page.locator('tr', { hasText: order.publicId }).locator('.status')).toHaveText('Подтверждён');
  });

  test('E2E-34: недопустимый переход статуса отклоняется', async function ({ page, request }) {
    const order = await createOrderViaApi(request);
    await loginAsAdmin(page);

    const row = page.locator('tr', { hasText: order.publicId });
    // В статусе NEW кнопки «Выполнен» быть не должно
    await expect(row.locator('[data-status=DONE]')).toHaveCount(0);
    await expect(row.locator('[data-status=CANCELLED]')).toBeVisible();
  });

  test('E2E-35: скрытый товар исчезает из витрины', async function ({ page, request }) {
    await loginAsAdmin(page);

    const productRow = page.locator('tr', { hasText: 'Морс клюквенный' });
    await productRow.locator('[data-toggle]').click();
    await expect(page.locator('tr', { hasText: 'Морс клюквенный' }).locator('[data-toggle]')).toHaveText('Вернуть');

    try {
      const storefront = await page.context().newPage();
      await storefront.goto('/');
      await expect(storefront.locator('.card').first()).toBeVisible();
      await expect(storefront.locator('.card')).toHaveCount(17);
      await expect(storefront.locator('.card__name', { hasText: 'Морс клюквенный' })).toHaveCount(0);
      await storefront.close();
    } finally {
      // возвращаем товар в продажу, чтобы не ломать другие тесты
      await request.patch('/api/admin/products/18', {
        headers: { Authorization: 'Bearer ' + (await getAdminToken(request)) },
        data: { isAvailable: true },
      });
    }
  });

  test('E2E-36: выход из аккаунта возвращает форму входа', async function ({ page }) {
    await loginAsAdmin(page);
    await page.locator('#logoutButton').click();

    await expect(page.locator('.login-box')).toBeVisible();
    await expect(page.locator('.stat')).toHaveCount(0);
  });
});

async function getAdminToken(request) {
  const response = await request.post('/api/auth/login', {
    data: { email: 'admin@shawarma.ru', password: 'Admin123!' },
  });
  const body = await response.json();
  return body.token;
}
