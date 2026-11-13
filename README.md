# 🌯 Шаурма-Мастер — учебный интернет-магазин

Полноценный проект интернет-магазина шаурмы, созданный как **полигон для функционального и автоматизированного тестирования**. Реальный backend, база данных, UI, Docker и полный набор тестовых артефактов.

> Проект специально сделан так, чтобы на нём было что тестировать: бизнес-правила, ограничения, состояния заказа, негативные сценарии и несколько намеренно оставленных дефектов (см. `docs/05-bug-reports.md`).

## Стек

| Слой | Технология |
|---|---|
| Backend | Node.js 22+, Express 4 |
| БД (Docker) | PostgreSQL 16 |
| БД (локально) | SQLite (встроенный `node:sqlite`) |
| Frontend | Vanilla JS + CSS, без сборки |
| Аутентификация | JWT (HS256) на встроенном `crypto` |
| Тесты | `node:test` + `fetch` |
| Инфраструктура | Docker, Docker Compose |

**Зависимостей всего две: `express` и `pg`.** Остальное — стандартная библиотека Node.

## Быстрый старт

### Вариант 1 — без Docker (самый быстрый)

```bash
npm install
npm start
```

Открой http://localhost:3000 — база создастся и наполнится автоматически (SQLite в `./data`).

### Вариант 2 — Docker + PostgreSQL

```bash
docker compose up --build
```

Поднимутся `shawarma-db` (PostgreSQL) и `shawarma-app`. Витрина — http://localhost:3000.

Подключение из **DBeaver**:

| Параметр | Значение |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `shawarma` |
| Username | `shawarma` |
| Password | `shawarma` |

### Вариант 3 — PostgreSQL локально

```bash
# .env
DATABASE_URL=postgres://shawarma:shawarma@localhost:5432/shawarma
npm start
```

## Тестовые учётные записи

| Роль | Email | Пароль |
|---|---|---|
| Администратор | `admin@shawarma.ru` | `Admin123!` |
| Покупатель | `customer@test.ru` | `Test123!` |

### Промокоды

| Код | Скидка | Состояние |
|---|---|---|
| `SHAWARMA10` | 10% | активен |
| `FIRSTORDER` | 15% | активен |
| `SUMMER20` | 20% | неактивен (негативные тесты) |
| `EXPIRED5` | 5% | просрочен (до 01.01.2024) |

## Структура

```
shawarma-shop/
├── src/
│   ├── server.js            точка входа: схема + сиды + listen
│   ├── app.js               сборка express-приложения
│   ├── config.js            конфигурация из ENV
│   ├── db/
│   │   ├── index.js         адаптер PostgreSQL / SQLite
│   │   ├── schema.js        DDL под оба диалекта
│   │   └── seed.js          демо-данные
│   ├── lib/                 jwt, пароли, валидация, ошибки
│   ├── middleware/          логирование, auth, обработка ошибок
│   └── routes/              health, menu, auth, promo, orders, admin
├── public/                  витрина и админка
├── tests/                   автотесты
├── docs/                    QA-документация
├── docker-compose.yml
├── Dockerfile
└── openapi.yaml
```

## API

Ошибки — в едином формате:

```json
{ "error": { "code": "MIN_ORDER_AMOUNT", "message": "Минимальная сумма заказа с доставкой — 500 руб.", "details": null } }
```

| Метод | Путь | Описание | Авторизация |
|---|---|---|---|
| GET | `/api/health` | Проверка живости | — |
| GET | `/api/menu` | Категории с товарами | — |
| GET | `/api/products/:id` | Товар по id | — |
| GET | `/api/extras` | Дополнители | — |
| POST | `/api/auth/register` | Регистрация | — |
| POST | `/api/auth/login` | Вход, JWT | — |
| GET | `/api/auth/me` | Текущий пользователь | Bearer |
| POST | `/api/promo/validate` | Проверка промокода | — |
| POST | `/api/orders` | Создание заказа | опционально |
| GET | `/api/orders` | Мои заказы | Bearer |
| GET | `/api/orders/:publicId` | Заказ по номеру | — |
| GET | `/api/orders/:publicId/history` | История статусов | — |
| GET | `/api/admin/orders` | Все заказы | admin |
| PATCH | `/api/admin/orders/:id/status` | Смена статуса | admin |
| GET | `/api/admin/stats` | Статистика | admin |
| GET | `/api/admin/products` | Все товары | admin |
| POST | `/api/admin/products` | Создать товар | admin |
| PATCH | `/api/admin/products/:id` | Изменить товар | admin |
| DELETE | `/api/admin/products/:id` | Скрыть товар | admin |

Полная спецификация — [openapi.yaml](openapi.yaml), Postman-коллекция — в `postman/`.

## Бизнес-правила

1. Минимальная сумма заказа с доставкой — 500 ₽, для самовывоза минимума нет.
2. Скидка считается от суммы товаров, округление вниз.
3. Статусы: `NEW → CONFIRMED → COOKING → DELIVERING → DONE`; отмена возможна из любого, кроме `DONE` и `CANCELLED`.
4. Один товар с разным набором дополнителей — две разные позиции корзины.
5. Недоступный товар заказать нельзя.
6. Лимит использований промокода учитывается суммарно.

## Тесты

```bash
npm test              # все тесты
npm run test:api      # только API
npm run test:smoke    # только smoke
```

В наборе **24 теста**: smoke, позитивные и негативные сценарии, проверка прав, переходы статусов.

## QA-артефакты

| Документ | Что внутри |
|---|---|
| [docs/01-requirements.md](docs/01-requirements.md) | Требования, user stories, критерии приёмки |
| [docs/02-test-plan.md](docs/02-test-plan.md) | Стратегия и план тестирования |
| [docs/03-test-cases.md](docs/03-test-cases.md) | 32 тест-кейса |
| [docs/04-checklist.md](docs/04-checklist.md) | Чек-лист регрессии |
| [docs/05-bug-reports.md](docs/05-bug-reports.md) | Шаблон и 8 баг-репортов |
| [docs/06-api-reference.md](docs/06-api-reference.md) | Справочник API |
| [docs/07-test-data.md](docs/07-test-data.md) | Тестовые данные |
| [docs/confluence/](docs/confluence/) | Готовые страницы для Confluence |

## Идеи для развития

- Транзакции при создании заказа
- Refresh-токены вместо суточного JWT
- Пагинация и фильтры в админке
- Загрузка изображений товаров
- Rate limiting на `/api/auth/login`
- CI на GitHub Actions

## Лицензия

Учебный проект. Свободно для портфолио и практики.
