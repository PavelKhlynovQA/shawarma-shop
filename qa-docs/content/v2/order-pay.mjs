// Модули «Оформление», «Оплата», «Уведомления» — кейсы v2 с сетевыми проверками.
export const ORDER_CASES = [
  {
    id: 'TC-ORDER-001',
    summary: 'Заказ создаётся и получает номер при заполнении обязательных полей самовывоза',
    module: 'Оформление заказа · Создание',
    type: 'Функциональный', kind: 'Позитивный', priority: 'High',
    labels: ['smoke', 'critical-path'], linked: 'FR-06; автотест E2E-40',
    preconditions: ['Пользователь не авторизован', 'В корзине есть товар на сумму не меньше минимальной', 'Открыта форма оформления заказа'],
    data: 'ТД-5 (данные покупателя и состав заказа)',
    steps: [
      { action: 'Выбрать способ получения «Самовывоз»', data: '—', expected: 'Поле «Адрес доставки» скрывается, обязательными остаются имя и телефон' },
      { action: 'Заполнить имя и телефон из ТД-5', data: 'ТД-5 (имя, телефон)', expected: 'Поля принимают значения без ошибок валидации' },
      { action: 'Нажать «Подтвердить заказ»', data: '—', expected: 'UI: открывается экран оплаты с номером заказа и суммой, равной сумме корзины. Network: запрос POST /api/orders → HTTP 201; Request Body: { "customerName", "phone", "deliveryType": "pickup", "items": [ { "productId", "quantity" } ] }; Response Body: { "order": { "publicId": "<номер>", "status": "NEW", "paymentStatus": "PENDING", "subtotal", "discount": 0, "total" } }' },
    ],
    postconditions: 'Заказ создан; для повторного прохождения использовать новый состав корзины',
  },
  {
    id: 'TC-ORDER-002',
    summary: 'Заказ не создаётся при вводе телефона в недопустимом формате',
    module: 'Оформление заказа · Валидация',
    type: 'Функциональный', kind: 'Негативный', priority: 'High',
    labels: ['critical-path', 'regression'], linked: 'FR-06; автотест E2E-22',
    preconditions: ['Пользователь не авторизован', 'В корзине есть товар', 'Открыта форма оформления заказа'],
    data: 'ТД-5 (имя); телефон «abc»',
    steps: [
      { action: 'Заполнить имя из ТД-5 и ввести в поле телефона abc', data: 'abc', expected: 'Поле принимает символы, сообщение об ошибке не появляется до отправки' },
      { action: 'Нажать «Подтвердить заказ»', data: '—', expected: 'UI: появляется сообщение об ошибке телефона, форма остаётся открытой, номер заказа не выдан. Network: запрос POST /api/orders → HTTP 400; Request Body: { "customerName", "phone": "abc", "deliveryType", "items": [...] }; Response Body: { "error": { "code": "VALIDATION_ERROR", "message": "Некорректные данные заказа", "details": [ { "field": "phone", "message": "Некорректный телефон" } ] } }' },
      { action: 'Открыть админ-панель в новой вкладке и найти заказ', data: '—', expected: 'Новый заказ в списке отсутствует' },
    ],
    postconditions: 'Нет',
  },
  {
    id: 'TC-ORDER-003',
    summary: 'Заказ с доставкой не создаётся при сумме ниже минимальной',
    module: 'Оформление заказа · Минимальная сумма',
    type: 'Функциональный', kind: 'Граничный', priority: 'High',
    labels: ['critical-path', 'regression'], linked: 'FR-07; автотест E2E-23',
    preconditions: ['Пользователь не авторизован', 'В корзине товар на сумму ниже минимальной для доставки (см. ТД-5)', 'Открыта форма оформления заказа'],
    data: 'ТД-5 (товар дешевле минимальной суммы, адрес доставки)',
    steps: [
      { action: 'Выбрать способ получения «Доставка»', data: '—', expected: 'Поле «Адрес доставки» становится видимым и обязательным' },
      { action: 'Заполнить имя, телефон и адрес из ТД-5', data: 'ТД-5', expected: 'Поля заполнены без ошибок валидации' },
      { action: 'Нажать «Подтвердить заказ»', data: '—', expected: 'UI: появляется сообщение о минимальной сумме заказа с доставкой, форма остаётся открытой. Network: запрос POST /api/orders → HTTP 409; Response Body: { "error": { "code": "MIN_ORDER_AMOUNT", "message": "Минимальная сумма заказа с доставкой — 500 руб.", "details": null } }' },
      { action: 'Сменить способ получения на «Самовывоз» и нажать «Подтвердить заказ»', data: '—', expected: 'Заказ создаётся: Network: POST /api/orders → HTTP 201 с номером заказа' },
    ],
    postconditions: 'Создан тестовый заказ на сумму ниже минимальной; учитывать при сверке статистики',
  },
];

export const PAY_CASES = [
  {
    id: 'TC-PAY-001',
    summary: 'Оплата заказа картой переводит заказ в статус PAID при валидных данных карты',
    module: 'Оплата · Успешный платёж',
    type: 'Функциональный', kind: 'Позитивный', priority: 'High',
    labels: ['smoke', 'critical-path'], linked: 'FR-09; автотест journey.spec.js',
    preconditions: ['Заказ создан и не оплачен', 'Открыт экран оплаты заказа'],
    data: 'ТД-6 (реквизиты успешной карты)',
    steps: [
      { action: 'Ввести данные карты из ТД-6 и нажать «Оплатить»', data: 'ТД-6', expected: 'Кнопка блокируется, отображается процесс проведения платежа. Network: запрос POST /api/orders/{publicId}/pay → HTTP 200; Request Body: { "cardNumber", "cardHolder", "expiry", "cvv" }; Response Body: { "order": { "publicId", "paymentStatus": "PAID", "cardLast4": "1111", "paidAt": "<ISO-дата>" }, "payment": { "status": "PAID", "last4": "1111" } }' },
      { action: 'Осмотреть экран после оплаты', data: '—', expected: 'Отображается сообщение об успешной оплате, сумма заказа и маска карты (последние 4 цифры)' },
    ],
    postconditions: 'Заказ оплачен; для повторного прохождения создать новый заказ',
  },
  {
    id: 'TC-PAY-002',
    summary: 'Заказ остаётся неоплаченным при отказе банка',
    module: 'Оплата · Отказ банка',
    type: 'Функциональный', kind: 'Негативный', priority: 'High',
    labels: ['critical-path'], linked: 'FR-09; автотест journey.spec.js',
    preconditions: ['Заказ создан и не оплачен', 'Открыт экран оплаты заказа'],
    data: 'ТД-6 (реквизиты карты с отказом)',
    steps: [
      { action: 'Ввести данные карты с отказом из ТД-6 и нажать «Оплатить»', data: 'ТД-6 (карта с отказом)', expected: 'UI: появляется сообщение об отказе банка, кнопка снова активна, экран оплаты остаётся. Network: запрос POST /api/orders/{publicId}/pay → HTTP 402; Response Body: { "error": { "code": "CARD_DECLINED", "message": "Банк отклонил платёж", "details": null } }' },
      { action: 'Осмотреть статус заказа', data: '—', expected: 'Заказ остаётся в статусе NEW с paymentStatus PENDING; экран успешной оплаты не появился' },
    ],
    postconditions: 'Нет',
  },
];

export const NOTIF_CASES = [
  {
    id: 'TC-NOTIF-001',
    summary: 'Уведомление о готовности появляется при смене статуса заказа на «В доставке»',
    module: 'Уведомления · Готовность заказа',
    type: 'Функциональный', kind: 'Позитивный', priority: 'High',
    labels: ['critical-path'], linked: 'FR-10, FR-11; автотест E2E-40',
    preconditions: ['Заказ оплачен', 'Экран отслеживания заказа открыт у клиента', 'Админ-панель открыта в другой вкладке под администратором'],
    data: 'ТД-7 (заказ для смены статуса)',
    steps: [
      { action: 'Перевести заказ в статус «Подтверждён», затем «Готовится» в админ-панели', data: '—', expected: 'UI админки: статус меняется на «Подтверждён», затем «Готовится». Network: запрос PATCH /api/admin/orders/{id}/status → HTTP 200; Request Body: { "status": "CONFIRMED", "note" }; Response Body: { "order": { "id", "status": "CONFIRMED" } }' },
      { action: 'Перевести заказ в статус «В доставке»', data: '—', expected: 'Network: PATCH /api/admin/orders/{id}/status → HTTP 200, статус DELIVERING' },
      { action: 'Дождаться обновления на экране клиента не более 5 секунд, не обновляя страницу', data: '—', expected: 'UI клиента: статус меняется на «В доставке», появляется баннер о готовности заказа. Network: автоматический запрос GET /api/orders/{publicId} → HTTP 200 с полем status: "DELIVERING"' },
    ],
    postconditions: 'Заказ в статусе DELIVERING; вернуть в исходное состояние при необходимости',
  },
];
