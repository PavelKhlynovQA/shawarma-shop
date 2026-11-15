// Формирует описание тест-кейса для Jira в формате:
//   ШАГИ ВЫПОЛНЕНИЯ: 1..N
//   ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ: 1..N  (с эндпоинтами и JSON)

const BASE = 'http://localhost:3000';

// Сетевые вызовы, которые происходят внутри UI-шагов
const SNIPPETS = {
  'otp-request': {
    method: 'POST', url: BASE + '/api/auth/phone/request-code',
    headers: { 'Content-Type': 'application/json' },
    request: { phone: '+7 900 777-66-55' },
    status: 200,
    response: { message: 'Код отправлен', phone: '79007776655', expiresInSeconds: 300, debugCode: '2302' },
  },
  'otp-verify-ok': {
    method: 'POST', url: BASE + '/api/auth/phone/verify',
    headers: { 'Content-Type': 'application/json' },
    request: { phone: '79007776655', code: '2302' },
    status: 200,
    response: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', user: { id: 7, email: 'phone79007776655@shawarma.local', name: 'Гость 6655', role: 'customer' } },
  },
  'otp-verify-bad': {
    method: 'POST', url: BASE + '/api/auth/phone/verify',
    headers: { 'Content-Type': 'application/json' },
    request: { phone: '79007776655', code: '0000' },
    status: 400,
    response: { error: { code: 'VALIDATION_ERROR', message: 'Неверный код', details: [{ field: 'code', message: 'Неверный код' }] } },
  },
  'login-admin': {
    method: 'POST', url: BASE + '/api/auth/login',
    headers: { 'Content-Type': 'application/json' },
    request: { email: 'admin@shawarma.ru', password: 'Admin123!' },
    status: 200,
    response: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', user: { id: 1, email: 'admin@shawarma.ru', name: 'Администратор', role: 'admin' } },
  },
  'order-create': {
    method: 'POST', url: BASE + '/api/orders',
    headers: { 'Content-Type': 'application/json' },
    request: { customerName: 'Пётр Телефонов', phone: '+7 900 777-66-55', deliveryType: 'delivery', address: 'Волгоград, ул. Мира, 15', items: [{ productId: 1, quantity: 2 }] },
    status: 201,
    response: { order: { publicId: 'SH-261114-9CE2', status: 'NEW', subtotal: 560, discount: 0, total: 560, paymentStatus: 'PENDING' } },
  },
  'order-min': {
    method: 'POST', url: BASE + '/api/orders',
    headers: { 'Content-Type': 'application/json' },
    request: { customerName: 'Тест', phone: '+79001234567', deliveryType: 'delivery', address: 'ул. Мира 1', items: [{ productId: 12, quantity: 1 }] },
    status: 409,
    response: { error: { code: 'MIN_ORDER_AMOUNT', message: 'Минимальная сумма заказа с доставкой — 500 руб.', details: null } },
  },
  'order-bad-phone': {
    method: 'POST', url: BASE + '/api/orders',
    headers: { 'Content-Type': 'application/json' },
    request: { customerName: 'Тест', phone: 'abc', deliveryType: 'pickup', items: [{ productId: 1, quantity: 1 }] },
    status: 400,
    response: { error: { code: 'VALIDATION_ERROR', message: 'Некорректные данные заказа', details: [{ field: 'phone', message: 'Некорректный телефон' }] } },
  },
  'pay-ok': {
    method: 'POST', url: BASE + '/api/orders/SH-261114-9CE2/pay',
    headers: { 'Content-Type': 'application/json' },
    request: { cardNumber: '4111 1111 1111 1111', cardHolder: 'PETR TELEFONOV', expiry: '12/30', cvv: '123' },
    status: 200,
    response: { order: { publicId: 'SH-261114-9CE2', paymentStatus: 'PAID', cardLast4: '1111', paidAt: '2026-11-14T20:15:02.331Z' }, payment: { status: 'PAID', last4: '1111' } },
  },
  'pay-declined': {
    method: 'POST', url: BASE + '/api/orders/SH-261114-9CE2/pay',
    headers: { 'Content-Type': 'application/json' },
    request: { cardNumber: '0000 1111 2222 3333', cardHolder: 'PETR TELEFONOV', expiry: '12/30', cvv: '123' },
    status: 402,
    response: { error: { code: 'CARD_DECLINED', message: 'Банк отклонил платёж', details: null } },
  },
  'order-poll': {
    method: 'GET', url: BASE + '/api/orders/SH-261114-9CE2',
    headers: {}, request: null, status: 200,
    response: { order: { publicId: 'SH-261114-9CE2', status: 'DELIVERING', paymentStatus: 'PAID', total: 680 } },
  },
  'status-change': {
    method: 'PATCH', url: BASE + '/api/admin/orders/12/status',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <admin-token>' },
    request: { status: 'CONFIRMED', note: 'Приняли в работу' },
    status: 200,
    response: { order: { id: 12, publicId: 'SH-261114-9CE2', status: 'CONFIRMED', updatedAt: '2026-11-14T20:20:01.110Z' } },
  },
  'product-hide': {
    method: 'DELETE', url: BASE + '/api/admin/products/18',
    headers: { Authorization: 'Bearer <admin-token>' },
    request: null, status: 200,
    response: { product: { id: 18, isAvailable: false }, message: 'Товар скрыт из меню' },
  },
};

// Для каких UI-шагов показывать сетевой вызов (индекс шага с нуля → ключ сниппета)
const UI_NET = {
  'TC-UI-09': { 1: ['otp-request'], 3: ['otp-verify-ok'] },
  'TC-UI-10': { 1: ['otp-verify-bad'] },
  'TC-UI-11': { 2: ['order-bad-phone'] },
  'TC-UI-12': { 2: ['order-min'], 3: ['order-min'] },
  'TC-UI-13': { 2: ['pay-ok'], 3: ['pay-ok'] },
  'TC-UI-14': { 1: ['pay-declined'] },
  'TC-UI-15': { 3: ['order-poll'] },
  'TC-UI-16': { 2: ['login-admin'] },
  'TC-UI-17': { 2: ['status-change'] },
  'TC-UI-18': { 1: ['product-hide'] },
};

function snippetText(key) {
  const s = SNIPPETS[key];
  if (!s) return '';
  const lines = [];
  lines.push('   Сетевой вызов:');
  const hk = Object.keys(s.headers || {});
  lines.push('   ' + s.method + ' ' + s.url);
  if (hk.length) lines.push('   Заголовки: ' + hk.map(function (k) { return k + ': ' + s.headers[k]; }).join('; '));
  if (s.request) {
    lines.push('   Тело запроса:');
    lines.push(JSON.stringify(s.request, null, 2).split('\n').map(function (l) { return '   ' + l; }).join('\n'));
  }
  lines.push('   Ответ HTTP ' + s.status + ':');
  lines.push(JSON.stringify(s.response, null, 2).split('\n').map(function (l) { return '   ' + l; }).join('\n'));
  return lines.join('\n');
}

export function buildDescription(c) {
  const lines = [];

  lines.push('МОДУЛЬ: ' + c.module + '  |  ТИП: ' + (c.type || 'Функциональный') + '  |  ПРИОРИТЕТ: ' + c.priority);
  lines.push('ТРЕБОВАНИЕ: ' + (c.requirement || '—') + '  |  АВТОТЕСТ: ' + (c.automation || '—'));
  lines.push('');

  lines.push('ПРЕДУСЛОВИЯ:');
  c.preconditions.forEach(function (p, i) { lines.push((i + 1) + '. ' + p); });
  lines.push('');

  // --- Шаги и ожидания ---
  let steps = [];
  let expected = [];

  if (c.api) {
    steps.push('Отправить запрос: ' + c.api.method + ' ' + c.api.url);
    expected.push(
      'Запрос уходит на ' + c.api.method + ' ' + c.api.url + '\n' +
      (Object.keys(c.api.headers || {}).length
        ? 'Заголовки: ' + Object.keys(c.api.headers).map(function (k) { return k + ': ' + c.api.headers[k]; }).join('; ') + '\n'
        : 'Заголовки: не требуются\n') +
      (c.api.body ? 'Тело запроса:\n' + JSON.stringify(c.api.body, null, 2) : 'Тело запроса: отсутствует')
    );

    steps.push('Проверить HTTP-статус и тело ответа');
    expected.push('Возвращается HTTP ' + c.api.status + ' с телом:\n' + JSON.stringify(c.api.response, null, 2));

    // Первый исходный шаг обычно дублирует «отправить запрос» — пропускаем его
    const methodRe = new RegExp('^' + c.api.method + '\\s');
    c.steps.forEach(function (s) {
      if (methodRe.test(s.action.trim())) return;
      steps.push(s.action);
      expected.push(s.expected);
    });
  } else {
    const netMap = UI_NET[c.id] || {};
    c.steps.forEach(function (s, i) {
      steps.push(s.action);
      let exp = s.expected;
      const netKeys = netMap[i];
      if (netKeys) {
        netKeys.forEach(function (key) {
          exp += '\n' + snippetText(key);
        });
      }
      expected.push(exp);
    });
  }

  lines.push('ШАГИ ВЫПОЛНЕНИЯ:');
  steps.forEach(function (s, i) { lines.push((i + 1) + '. ' + s); });
  lines.push('');

  lines.push('ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:');
  expected.forEach(function (e, i) {
    const parts = e.split('\n');
    lines.push((i + 1) + '. ' + parts[0]);
    for (let k = 1; k < parts.length; k++) lines.push('   ' + parts[k]);
    lines.push('');
  });

  if (c.notes) {
    lines.push('ПРИМЕЧАНИЕ: ' + c.notes);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
