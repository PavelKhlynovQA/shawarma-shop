# Справочник API

Базовый URL: `http://localhost:3000`

## Общие положения

- Формат: JSON, `Content-Type: application/json`
- Авторизация: `Authorization: Bearer <JWT>`
- Каждый ответ содержит `X-Request-Id`

### Формат ошибки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные заказа",
    "details": [{ "field": "phone", "message": "Некорректный телефон" }]
  }
}
```

| HTTP | Когда |
|---|---|
| 200 | Успех |
| 201 | Создано |
| 204 | Preflight CORS |
| 400 | Ошибка валидации / невалидный JSON |
| 401 | Нет или неверный токен |
| 403 | Недостаточно прав |
| 404 | Объект не найден |
| 409 | Нарушено бизнес-правило |
| 500 | Внутренняя ошибка |

---

## health

### GET /api/health

```json
{ "status": "ok", "dbDriver": "sqlite", "uptimeSeconds": 12, "timestamp": "2026-11-13T20:14:33.500Z" }
```

---

## menu

### GET /api/menu

Параметр `includeUnavailable=true` — показать скрытые товары.

```json
{
  "categories": [
    {
      "id": 1, "name": "Шаурма", "slug": "shawarma",
      "products": [
        { "id": 1, "name": "Шаурма классическая", "price": 280, "weightG": 350, "isSpicy": false, "isAvailable": true, "emoji": "🌯" }
      ]
    }
  ]
}
```

### GET /api/products/:id
`200` с товаром или `404 NOT_FOUND`.

### GET /api/extras
```json
{ "extras": [{ "id": 1, "name": "Двойное мясо", "price": 120 }] }
```

---

## auth

### POST /api/auth/register

```json
{ "email": "user@test.ru", "password": "123456", "name": "Иван", "phone": "+7 900 000-00-00" }
```

Ответ `201`: `{ "token": "...", "user": { "id": 3, "email": "...", "role": "customer" } }`

Ошибки: `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`.

### POST /api/auth/login

```json
{ "email": "admin@shawarma.ru", "password": "Admin123!" }
```

Ошибки: `401 INVALID_CREDENTIALS`.

### GET /api/auth/me
Требует Bearer. Возвращает текущего пользователя.

---

## promo

### POST /api/promo/validate

```json
{ "code": "SHAWARMA10", "subtotal": 1000 }
```

```json
{ "promo": { "code": "SHAWARMA10", "discountPercent": 10, "discount": 100, "total": 900 } }
```

Ошибки: `409 PROMO_INACTIVE`, `409 PROMO_EXPIRED`, `409 PROMO_LIMIT_EXCEEDED`.

---

## orders

### POST /api/orders

```json
{
  "customerName": "Иван Тестов",
  "phone": "+7 900 123-45-67",
  "deliveryType": "delivery",
  "address": "Волгоград, ул. Мира, 15",
  "comment": "Без лука",
  "promoCode": "SHAWARMA10",
  "items": [
    { "productId": 1, "quantity": 2, "extraIds": [1, 2] },
    { "productId": 9, "quantity": 1 }
  ]
}
```

Ответ `201`:

```json
{
  "order": {
    "publicId": "SH-261113-8D5C",
    "status": "NEW",
    "subtotal": 1050,
    "discount": 105,
    "total": 945,
    "items": [{ "name": "Шаурма классическая", "price": 280, "quantity": 2, "extras": [], "lineTotal": 560 }],
    "history": [{ "status": "NEW", "note": "Заказ создан", "createdAt": "..." }]
  }
}
```

Ошибки:
- `400 VALIDATION_ERROR` — пустая корзина, неверный телефон, нет адреса, нет товара
- `409 MIN_ORDER_AMOUNT` — доставка дешевле 500 ₽
- `409 PRODUCT_UNAVAILABLE` — товар скрыт
- `409 PROMO_*` — проблема с промокодом

### GET /api/orders
Требует Bearer. Возвращает до 100 заказов текущего пользователя.

### GET /api/orders/:publicId
Публичный просмотр заказа (см. BUG-005).

### GET /api/orders/:publicId/history
История статусов.

---

## admin

Все методы требуют `role = admin`, иначе `401` / `403`.

### GET /api/admin/orders?status=NEW&limit=50&offset=0

### PATCH /api/admin/orders/:id/status

```json
{ "status": "CONFIRMED", "note": "Приняли в работу" }
```

Ошибки: `409 INVALID_STATUS_TRANSITION`.

### GET /api/admin/stats

```json
{
  "stats": {
    "ordersTotal": 12,
    "ordersToday": 3,
    "revenue": 8450,
    "byStatus": { "NEW": 2, "DONE": 10 },
    "topProducts": [{ "name": "Шаурма классическая", "sold": 24 }]
  }
}
```

### GET /api/admin/products
### POST /api/admin/products

```json
{ "categoryId": 1, "name": "Шаурма новая", "price": 300, "description": "Описание", "isSpicy": false }
```

### PATCH /api/admin/products/:id

```json
{ "price": 320, "isAvailable": false }
```

### DELETE /api/admin/products/:id
Мягкое удаление: `is_available = 0`.
