import { test, expect } from '@playwright/test';
import { StorefrontPage } from './pages/StorefrontPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { PRODUCTS } from './helpers.js';

test.describe('Витрина', function () {
  let store;

  test.beforeEach(async function ({ page }) {
    store = new StorefrontPage(page);
    await store.open();
  });

  test('E2E-01: страница открывается с корректным заголовком', async function ({ page }) {
    await expect(page).toHaveTitle(/Шаурма-Мастер/);
    await expect(store.heading).toContainText('Шаурма, которая решает');
  });

  test('E2E-02: отображаются все категории и товары', async function () {
    await expect(store.tabs).toHaveCount(6); // «Всё меню» + 5 категорий
    await expect(store.cards).toHaveCount(18);

    for (const category of ['Шаурма', 'Донер', 'Закуски', 'Соусы', 'Напитки']) {
      await expect(store.tab(category)).toBeVisible();
    }
  });

  test('E2E-03: фильтр по категории «Напитки» показывает только напитки', async function () {
    await store.tab('Напитки').click();

    await expect(store.cards).toHaveCount(4);
    await expect(store.card(PRODUCTS.cola.name)).toBeVisible();
    await expect(store.card(PRODUCTS.classic.name)).toHaveCount(0);
  });

  test('E2E-04: карточка товара содержит цену, вес и кнопку', async function () {
    const card = store.card(PRODUCTS.classic.name);
    await expect(card.locator('.card__price')).toHaveText('280 ₽');
    await expect(card.locator('.card__meta')).toContainText('350 г');
    await expect(card.locator('[data-add]')).toBeEnabled();
  });

  test('E2E-05: переход в админ-панель по ссылке в футере', async function ({ page }) {
    await page.locator('footer a', { hasText: 'Админ-панель' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(new AdminPage(page).loginBox).toBeVisible();
  });

  test('E2E-06: загрузка страницы без ошибок в консоли', async function ({ page }) {
    const errors = [];
    page.on('console', function (message) {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.reload();
    await expect(store.cards.first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
