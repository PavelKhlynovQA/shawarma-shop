# 🌯 Шаурма-Мастер — учебный интернет-магазин

![CI](https://github.com/PavelKhlynovQA/shawarma-shop/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen)
![Тесты](https://img.shields.io/badge/tests-79%20passed-success)
![Playwright](https://img.shields.io/badge/E2E-Playwright-2EAD33)

[![Confluence](https://img.shields.io/badge/Confluence-документация-0052CC?logo=confluence&logoColor=white)](https://boysporting.atlassian.net/wiki/spaces/QASHOP)
[![Jira](https://img.shields.io/badge/Jira-53%20тест--кейса%20·%2010%20багов-0052CC?logo=jira&logoColor=white)](https://boysporting.atlassian.net/jira/software/projects/SCRUM)

Рабочий интернет-магазин шаурмы, созданный как **полигон для функционального и автоматизированного тестирования**. Здесь есть реальный backend, база данных, UI, Docker, 63 автотеста и полный цикл QA-документации — от требований до руководства администратора.

> Проект специально сделан так, чтобы на нём было что тестировать: бизнес-правила, граничные значения, состояния заказа, права доступа и два дефекта, найденных автотестами (BUG-009, BUG-010).

---

## 📋 Где смотреть артефакты

| Артефакт | Ссылка | Что внутри |
|---|---|---|
| **Документация** | [Confluence · QA · Шаурма-Мастер](https://boysporting.atlassian.net/wiki/spaces/QASHOP) | 4 раздела, 23 страницы |
| **Все тест-кейсы** | [Фильтр «QA · Тест-кейсы»](https://boysporting.atlassian.net/issues/?filter=10001) | 53 кейса, 232 шага |
| **API-тест-кейсы** | [Фильтр «QA · API-тесты»](https://boysporting.atlassian.net/issues/?filter=10003) | 27 кейсов с JSON запросов и ответов |
| **UI-тест-кейсы** | [Фильтр «QA · UI-тесты»](https://boysporting.atlassian.net/issues/?filter=10004) | 18 кейсов со скриншотами |
| **БД-тест-кейсы** | [Фильтр «QA · БД-тесты»](https://boysporting.atlassian.net/issues/?filter=10005) | 8 SQL-проверок |
| **Баг-репорты** | [Фильтр «QA · Баг-репорты»](https://boysporting.atlassian.net/issues/?filter=10002) | 10 дефектов |
| **Автотесты** | [`tests/`](tests/) | 23 API + 35 E2E + 5 визуальных |
| **Результаты прогонов** | [Actions](https://github.com/PavelKhlynovQA/shawarma-shop/actions) | Allure и Playwright-отчёты |
| **Исходники документации** | [`qa-docs/`](qa-docs/) | Генераторы и данные страниц |

![Confluence](docs/screenshots/confluence-space.png)

> 🔒 Confluence и Jira приватные — доступ по приглашению. Скриншоты ключевых экранов: [`docs/screenshots/`](docs/screenshots/).

---

## 🗂 Как устроены артефакты

**Принцип: один источник правды на каждый тип артефакта.**

| Тип | Где живёт | Почему |
|---|---|---|
| Тест-кейсы и баги | **Jira** | У них есть статус, исполнитель, история и связи — их *исполняют* |
| Требования, проектирование | **Confluence** | Их *читают* и согласовывают |
| Стратегия, план, отчёты, руководства | **Confluence** | Документы для команды |
| Код и автотесты | **GitHub** | Версионирование и CI |

Страницы «Тест-кейсы» и «Баг-репорты» в Confluence — это **индексы со ссылками** на задачи Jira. Дублей нет, навигация сохранена.

### Структура Confluence

```
QA · Шаурма-Мастер
├── 1. Требования          (5 страниц)  постановка, FR, NFR, истории, ТЗ
├── 2. Проектирование      (4 страницы) архитектура, схема БД, API, макеты
├── 3. Тестирование       (10 страниц) стратегия, план, кейсы, чек-листы, баги, отчёт
└── 4. Эксплуатация        (4 страницы) развёртывание, руководства, changelog
```

### Структура Jira

```
Shawarma Project (SCRUM)
├── 📁 Тест-кейсы API (27)  SCRUM-72   → TC-API-01…27
├── 📁 Тест-кейсы UI (18)   SCRUM-73   → TC-UI-01…18
├── 📁 Тест-кейсы БД (8)    SCRUM-74   → TC-DB-01…08
├── 🐞 Баг-репорты (10)     SCRUM-71   → BUG-001…010
└── QA: Шаурма-Мастер …     SCRUM-6    → эпик-зонтик
```

Каждый тест-кейс содержит: предусловия, **пошаговые ожидаемые результаты**, эндпоинт с телом запроса и ответом (для API), ссылку на автотест и, где полезно, скриншот.

---

## 🛠 Стек

| Слой | Технология |
|---|---|
| Backend | Node.js 24+, Express 4 |
| БД (Docker) | PostgreSQL 16 |
| БД (локально) | SQLite (встроенный `node:sqlite`) |
| Frontend | Vanilla JS + CSS, без сборки |
| Аутентификация | JWT (HS256) на встроенном `crypto`, вход по телефону (OTP) |
| Тесты | `node:test` + `fetch`, Playwright, визуальная регрессия |
| Документация | Confluence Storage Format, генераторы на Node.js |
| Инфраструктура | Docker, Docker Compose, GitHub Actions |

**Зависимостей в рантайме всего две: `express` и `pg`.** Всё остальное — стандартная библиотека Node.

---

## 🚀 Быстрый старт

### Вариант 1 — без Docker

```bash
npm install
npm start
```

Открой http://localhost:3000 — база создастся и наполнится автоматически (SQLite в `./data`).

### Вариант 2 — Docker + PostgreSQL

```bash
docker compose up --build -d
```

Подключение из **DBeaver**: `localhost:5432`, база/пользователь/пароль — `shawarma`.

### Вариант 3 — PostgreSQL локально

```bash
DATABASE_URL=postgres://shawarma:shawarma@localhost:5432/shawarma npm start
```

---

## 🔑 Тестовые данные

| Роль | Логин | Пароль |
|---|---|---|
| Администратор | `admin@shawarma.ru` | `Admin123!` |
| Покупатель | `customer@test.ru` | `Test123!` |
| Вход по телефону | любой номер из 10–15 цифр | код показывается на экране (демо) |

**Промокоды:** `SHAWARMA10` (10%), `FIRSTORDER` (15%) — активны; `SUMMER20` — неактивен; `EXPIRED5` — просрочен.

**Тестовые карты:** `4111 1111 1111 1111` — успех; `0000 1111 2222 3333` — отказ банка (402).

---

## 📁 Структура репозитория

```
shawarma-shop/
├── src/                        backend
│   ├── server.js               схема + миграции + сиды + listen
│   ├── app.js                  сборка express-приложения
│   ├── db/                     адаптер PostgreSQL/SQLite, схема, миграции, сиды
│   ├── lib/                    jwt, пароли, валидация, ошибки
│   ├── middleware/             логирование, auth, обработка ошибок
│   └── routes/                 health, menu, auth, promo, orders, admin
├── public/                     витрина и админка (vanilla JS)
├── tests/
│   ├── api.test.js             23 API-теста
│   └── e2e/
│       ├── pages/              6 Page Object классов
│       └── *.spec.js           35 E2E-сценариев
├── tests/visual/               5 визуальных снапшотов
├── qa-docs/
│   ├── content/                данные документации (единый источник)
│   ├── build.mjs               сайт + Confluence-страницы + CSV
│   ├── build-package.mjs       полный пакет из 4 разделов
│   ├── publish-*.mjs           публикация в Confluence и Jira
│   └── pkg/                    24 готовых HTML-страницы
├── docs/                       QA-документация и скриншоты
├── .github/workflows/ci.yml    4 job'а CI
└── docker-compose.yml
```

---

## 🔌 API

Единый формат ошибок:

```json
{ "error": { "code": "MIN_ORDER_AMOUNT", "message": "Минимальная сумма заказа с доставкой — 500 руб.", "details": null } }
```

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| GET | `/api/health` | — | Живость и драйвер БД |
| GET | `/api/menu` | — | Категории с товарами |
| GET | `/api/products/:id` | — | Товар по id |
| GET | `/api/extras` | — | Дополнители |
| POST | `/api/auth/register` | — | Регистрация |
| POST | `/api/auth/login` | — | Вход по email |
| GET | `/api/auth/me` | Bearer | Текущий пользователь |
| POST | `/api/auth/phone/request-code` | — | Код на телефон |
| POST | `/api/auth/phone/verify` | — | Вход по коду |
| POST | `/api/promo/validate` | — | Проверка промокода |
| GET | `/api/cart` | опц. | Получить корзину |
| POST | `/api/cart/items` | опц. | Добавить товар в корзину |
| PATCH | `/api/cart/items/:id` | опц. | Изменить количество |
| DELETE | `/api/cart/items/:id` | опц. | Удалить позицию |
| DELETE | `/api/cart` | опц. | Очистить корзину |
| POST | `/api/orders` | опц. | Создание заказа |
| POST | `/api/orders/:publicId/pay` | опц. | Оплата картой |
| GET | `/api/orders` | Bearer | Мои заказы |
| GET | `/api/orders/:publicId` | — | Заказ по номеру |
| GET | `/api/orders/:publicId/history` | — | История статусов |
| GET | `/api/admin/orders` | admin | Очередь заказов |
| PATCH | `/api/admin/orders/:id/status` | admin | Смена статуса |
| GET | `/api/admin/stats` | admin | Статистика |
| GET/POST/PATCH/DELETE | `/api/admin/products` | admin | Управление меню |

Полная спецификация — [openapi.yaml](openapi.yaml), коллекция — `postman/`.

---

## 📏 Бизнес-правила

1. Минимальная сумма заказа **с доставкой** — 500 ₽; для самовывоза минимума нет.
2. Скидка считается от суммы товаров, округление вниз.
3. Статусы: `NEW → CONFIRMED → COOKING → DELIVERING → DONE`; отмена из любого, кроме финальных.
4. Один товар с разным набором допов — разные позиции корзины.
5. Скрытый товар (`is_available = 0`) заказать нельзя.
6. Код входа живёт 5 минут, максимум 5 попыток.
7. Повторная оплата заказа запрещена (409 `ALREADY_PAID`).

---

## ✅ Автотесты — 63 штуки

| Уровень | Кол-во | Время | Команда |
|---|---|---|---|
| API (`node:test`) | 39 | ~3 с | `npm test` |
| E2E (Playwright) | 35 | ~40 с | `npm run test:e2e` |
| Визуальные | 5 | ~7 с | `npm run test:visual` |

### API-тесты

```bash
npm test                  # все API-тесты
npm run test:api          # только файл API
npm run test:smoke        # только smoke
npm run test:no-isolation # если среда не даёт запускать дочерние процессы
```

### E2E-тесты

```bash
npx playwright install chromium
npm run test:e2e          # 35 сценариев
npm run test:e2e:headed   # с видимым браузером
npm run test:e2e:ui       # интерактивный режим
npm run report            # HTML-отчёт
```

Построены на **Page Object Model**: `StorefrontPage`, `ProductModal`, `CartDrawer`, `CheckoutModal`, `AdminPage`, `AuthModal`. Селекторов в тестах нет.

### Сквозной сценарий покупателя

```bash
npm run test:journey      # 5 тестов: вход → корзина → оплата → уведомление
npm run demo:journey      # видимый браузер + скриншоты
```

### Визуальная регрессия

```bash
npm run test:visual         # сравнить с эталонами
npm run test:visual:update  # перегенерировать эталоны
```

### Отчёт Allure

```bash
npm run test:e2e && npm run allure:generate && npm run allure:open
```

---

## 🧾 Документация

Вся документация генерируется из одного источника в `qa-docs/content/`.

```bash
npm run docs:build                    # сайт + Confluence + CSV
node qa-docs/build-package.mjs        # полный пакет из 4 разделов
node qa-docs/publish-package.mjs      # публикация в Confluence
node qa-docs/update-jira-cases.mjs    # обновление тест-кейсов в Jira
```

| Результат | Куда |
|---|---|
| `qa-docs/pkg/*.html` | 24 страницы в формате Confluence Storage Format |
| `qa-docs/site/index.html` + PDF | Документация одним файлом |
| `qa-docs/jira/*.csv` | 53 кейса и 10 багов для импорта |

---

## 🔄 CI/CD

Четыре job'а при каждом push:

| Job | Что делает |
|---|---|
| `api-tests` | 23 API-теста на Node 24 |
| `e2e-tests` | 35 Playwright-тестов + генерация Allure |
| `visual-tests` | 5 визуальных тестов (windows-latest) |
| `docker-build` | Сборка образа + проверка `/api/health` |

Конфигурация — [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## 🐛 Дефекты, найденные тестами

| ID | Серьёзность | Суть | Статус |
|---|---|---|---|
| BUG-009 | Blocker | Модалки не скрывались — витрина была некликабельна | Исправлен |
| BUG-010 | Major | Неверный пароль в админке не показывал ошибку | Исправлен |
| BUG-005 | Critical | Заказ читается по номеру без авторизации | Открыт |
| BUG-006 | Major | Создание заказа без транзакции | Открыт |

Полный список — [фильтр «QA · Баг-репорты»](https://boysporting.atlassian.net/issues/?filter=10002).

---

## 📸 Скриншоты

| Экран | Файл |
|---|---|
| Витрина с фотографиями блюд | [menu-final.png](docs/screenshots/menu-final.png) |
| Форма оплаты | [journey-3-payment.png](docs/screenshots/journey-3-payment.png) |
| Уведомление «заказ готов» | [journey-5-ready.png](docs/screenshots/journey-5-ready.png) |
| Отчёт Allure | [allure-report.png](docs/screenshots/allure-report.png) |
| Пространство Confluence | [confluence-space.png](docs/screenshots/confluence-space.png) |

---

## ⚠️ Ограничения

- Оплата имитируется — реального эквайринга нет
- Код подтверждения возвращается в ответе API (демо-режим, нет SMS-шлюза)
- Нет транзакций при создании заказа (BUG-006)
- Заказ доступен по номеру без авторизации (BUG-005)
- Пагинации и фильтров в админке нет
- Xray не установлен: тест-кейсы живут как задачи Jira с меткой `test-case`

## 🗺 Планы

- Транзакции и резервирование промокода
- Refresh-токены и rate limiting
- Пагинация и поиск в админке
- Уведомления в Telegram вместо опроса статуса
- Подключение Xray при переходе на платный тариф

---

## 📄 Лицензия

Учебный проект. Свободно для портфолио и практики.
Фотографии блюд — Wikimedia Commons, атрибуция в [docs/IMAGE-CREDITS.md](docs/IMAGE-CREDITS.md).
