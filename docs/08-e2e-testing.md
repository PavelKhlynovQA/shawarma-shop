# E2E-тестирование (Playwright)

## Зачем

API-тесты проверяют контракт, но не видят, что происходит в браузере. Именно E2E-набор нашёл **BUG-009** — дефект, из-за которого витрина была полностью некликабельна, хотя все 24 API-теста были зелёными.

## Установка

```bash
npm install
npx playwright install chromium
```

## Запуск

```bash
npm run test:e2e          # headless, все тесты
npm run test:e2e:headed   # с видимым браузером
npm run test:e2e:ui       # интерактивный UI-режим
npm run report            # HTML-отчёт последнего прогона
```

Конфигурация — `playwright.config.js`. Playwright сам поднимает приложение на SQLite (`data/e2e.db`) либо переиспользует уже запущенный сервер.

## Структура

```
tests/e2e/
├── pages/                  Page Object Model
│   ├── BasePage.js         базовый переход и общее поведение
│   ├── StorefrontPage.js   витрина: карточки, вкладки, добавление в корзину
│   ├── ProductModal.js     модалка товара: количество, дополнители
│   ├── CartDrawer.js       корзина: количество, удаление, переход к оформлению
│   ├── CheckoutModal.js    форма заказа и экран успеха
│   └── AdminPage.js        вход, заказы, статусы, товары
├── helpers.js              справочники товаров и API-хелперы
├── storefront.spec.js      витрина
├── cart.spec.js            корзина и расчёты
├── checkout.spec.js        оформление заказа
└── admin.spec.js           админ-панель
```

## Page Object Model

Тесты не содержат CSS-селекторов — они живут только в классах страниц. Если вёрстка поменяется, правится один файл.

```js
const store = new StorefrontPage(page);
await store.open();
await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });

const cart = await store.openCart();
const checkout = await cart.goToCheckout();
await checkout.fill({ deliveryType: 'pickup' });
await checkout.submit();
await expect(checkout.successId).toBeVisible();
```

Каждый Page Object инкапсулирует локаторы и действия, возвращает следующий объект — получается читаемая цепочка, как в тесте выше.

## Покрытие

| Файл | Тесты | Что проверяет |
|---|---|---|
| storefront | 6 | заголовок, категории, фильтр, карточка, переход в админку, консоль без ошибок |
| cart | 7 | добавление, допы, количество, удаление, сохранение, разные наборы допов |
| checkout | 10 | пустая корзина, валидации, минимум 500 ₽, успешный заказ, промокод, очистка корзины |
| admin | 7 | форма входа, неверный пароль, статистика, смена статуса, скрытие товара, выход |

**Всего: 30 тестов.**

## Использованные приёмы

- **Хелперы вместо Page Object** — для учебного проекта достаточно; в реальном стоит вынести Page Object.
- **Данные через API** (`createOrderViaApi`) — быстро и не зависит от UI-шагов.
- **Никаких `waitForTimeout`** — только `expect` с автоожиданием, чтобы тесты не были «зелёными от сна».
- **Изоляция** — каждый тест чистит localStorage и не зависит от порядка выполнения.
- **Трейсы** — при падении сохраняются trace, скриншот и видео.

## Отладка падений

```bash
npx playwright show-trace test-results/<test>/trace.zip
```

## Что можно добавить

- Page Object Model
- Доступность (`@axe-core/playwright`)
- Визуальные снапшоты (`toHaveScreenshot`)
- Кросс-браузерность (Firefox, WebKit)
- Allure-отчёт (`allure-playwright`)
