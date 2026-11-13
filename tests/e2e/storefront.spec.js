import { test, expect } from '@playwright/test';
import { openStore } from './helpers.js';

test.describe('Витрина', function () {
  test.beforeEach(async function ({ page }) {
    await openStore(page);
  });

  test('E2E-01: страница открывается с корректным заголовком', async function ({ page }) {
    await expect(page).toHaveTitle(/Шаурма-Мастер/);
    await expect(page.locator('h1')).toContainText('Шаурма, которая решает');
  });

  test('E2E-02: отображаются все категории и товары', async function ({ page }) {
    const tabs = page.locator('.tab');
    await expect(tabs).toHaveCount(6); // «Всё меню» + 5 категорий
    await expect(page.locator('.card')).toHaveCount(18);

    for (const category of ['Шаурма', 'Донер', 'Закуски', 'Соусы', 'Напитки']) {
      await expect(page.locator('.tab', { hasText: category })).toBeVisible();
    }
  });

  test('E2E-03: фильтр по категории «Напитки» показывает только напитки', async function ({ page }) {
    await page.locator('.tab', { hasText: 'Напитки' }).click();

    const cards = page.locator('.card');
    await expect(cards).toHaveCount(4);
    await expect(page.locator('.card__name', { hasText: 'Кола 0.5' })).toBeVisible();
    await expect(page.locator('.card__name', { hasText: 'Шаурма классическая' })).toHaveCount(0);
  });

  test('E2E-04: карточка товара содержит цену, вес и кнопку', async function ({ page }) {
    const card = page.locator('.card').filter({ hasText: 'Шаурма классическая' }).first();
    await expect(card.locator('.card__price')).toHaveText('280 ₽');
    await expect(card.locator('.card__meta')).toContainText('350 г');
    await expect(card.locator('[data-add]')).toBeEnabled();
  });

  test('E2E-05: переход в админ-панель по ссылке в футере', async function ({ page }) {
    await page.locator('footer a', { hasText: 'Админ-панель' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('h2', { hasText: 'Вход для администратора' })).toBeVisible();
  });

  test('E2E-06: загрузка страницы без ошибок в консоли', async function ({ page }) {
    const errors = [];
    page.on('console', function (message) {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.reload();
    await expect(page.locator('.card').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
