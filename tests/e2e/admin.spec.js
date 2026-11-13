import { test, expect } from '@playwright/test';
import { AdminPage } from './pages/AdminPage.js';
import { ADMIN, createOrderViaApi, getAdminToken } from './helpers.js';

test.describe('Админ-панель', function () {
  let admin;

  test.beforeEach(async function ({ page }) {
    admin = new AdminPage(page);
    await admin.openWithCleanSession();
  });

  test('E2E-30: без авторизации показывается форма входа', async function () {
    await expect(admin.loginBox).toBeVisible();
    await expect(admin.page.locator('h2', { hasText: 'Вход для администратора' })).toBeVisible();
    await expect(admin.logoutButton).toBeHidden();
  });

  test('E2E-31: неверный пароль показывает ошибку', async function ({ page }) {
    await admin.login(ADMIN.email, 'wrong-password');

    await expect(page.locator('.toast--error')).toContainText('Неверный email или пароль');
    await expect(admin.loginBox).toBeVisible();
  });

  test('E2E-32: успешный вход открывает статистику и таблицу заказов', async function () {
    await admin.loginAsAdmin();

    await expect(admin.stats).toHaveCount(4);
    await expect(admin.page.locator('h1')).toHaveText('Заказы');
    await expect(admin.ordersTable).toBeVisible();
    await expect(admin.logoutButton).toBeVisible();
  });

  test('E2E-33: смена статуса заказа NEW → Подтверждён', async function ({ request }) {
    const order = await createOrderViaApi(request);
    await admin.loginAsAdmin();

    await expect(admin.orderRow(order.publicId)).toContainText('Новый');

    await admin.changeStatus(order.publicId, 'CONFIRMED');
    await expect(admin.orderRow(order.publicId).locator('.status')).toHaveText('Подтверждён');
  });

  test('E2E-34: недоступные переходы статуса не предлагаются', async function ({ request }) {
    const order = await createOrderViaApi(request);
    await admin.loginAsAdmin();

    const row = admin.orderRow(order.publicId);
    await expect(row.locator('[data-status=DONE]')).toHaveCount(0);
    await expect(row.locator('[data-status=CANCELLED]')).toBeVisible();
  });

  test('E2E-35: скрытый товар исчезает из витрины', async function ({ page, request }) {
    await admin.loginAsAdmin();

    const row = admin.productRow('Морс клюквенный');
    await row.locator('[data-toggle]').click();
    await expect(admin.productRow('Морс клюквенный').locator('[data-toggle]')).toHaveText('Вернуть');

    try {
      const storefront = await page.context().newPage();
      await storefront.goto('/');
      await expect(storefront.locator('.card').first()).toBeVisible();
      await expect(storefront.locator('.card')).toHaveCount(17);
      await expect(storefront.locator('.card__name', { hasText: 'Морс клюквенный' })).toHaveCount(0);
      await storefront.close();
    } finally {
      const token = await getAdminToken(request);
      await request.patch('/api/admin/products/18', {
        headers: { Authorization: 'Bearer ' + token },
        data: { isAvailable: true },
      });
    }
  });

  test('E2E-36: выход из аккаунта возвращает форму входа', async function () {
    await admin.loginAsAdmin();
    await admin.logout();

    await expect(admin.loginBox).toBeVisible();
    await expect(admin.stats).toHaveCount(0);
  });
});
