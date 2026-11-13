// Админ-панель: заказы, статусы, статистика, управление меню.

const TOKEN_KEY = 'shawarma_admin_token';
const root = document.getElementById('app');
const logoutButton = document.getElementById('logoutButton');
const toasts = document.getElementById('toasts');

const STATUS_FLOW = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COOKING', 'CANCELLED'],
  COOKING: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

const STATUS_LABEL = {
  NEW: 'Новый',
  CONFIRMED: 'Подтверждён',
  COOKING: 'Готовится',
  DELIVERING: 'В доставке',
  DONE: 'Выполнен',
  CANCELLED: 'Отменён',
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function toast(message, isError) {
  const node = document.createElement('div');
  node.className = 'toast' + (isError ? ' toast--error' : '');
  node.textContent = message;
  toasts.appendChild(node);
  setTimeout(function () { node.remove(); }, 3200);
}

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch(path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await response.json(); } catch (e) { data = null; }
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    renderLogin();
    throw new Error('Сессия истекла, войдите заново');
  }
  return { ok: response.ok, status: response.status, data: data };
}

function money(value) {
  return Number(value).toLocaleString('ru-RU') + ' ₽';
}

function renderLogin() {
  logoutButton.hidden = true;
  root.innerHTML = [
    '<div class="login-box">',
    '  <h2 style="margin-top:0">Вход для администратора</h2>',
    '  <div class="field"><label>Email</label><input id="email" value="admin@shawarma.ru" /></div>',
    '  <div class="field"><label>Пароль</label><input id="password" type="password" value="Admin123!" /></div>',
    '  <button class="btn btn--block" id="loginButton">Войти</button>',
    '  <p class="card__desc" style="margin-top:12px">Демо-доступ: admin@shawarma.ru / Admin123!</p>',
    '</div>',
  ].join('');

  document.getElementById('loginButton').addEventListener('click', async function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const result = await api('POST', '/api/auth/login', { email: email, password: password });
    if (!result.ok) {
      toast(result.data && result.data.error ? result.data.error.message : 'Ошибка входа', true);
      return;
    }
    localStorage.setItem(TOKEN_KEY, result.data.token);
    renderDashboard();
  });
}

function orderRow(order) {
  const actions = (STATUS_FLOW[order.status] || []).map(function (status) {
    return '<button class="mini" data-status="' + status + '" data-id="' + order.id + '">' + (STATUS_LABEL[status] || status) + '</button>';
  }).join('');

  return [
    '<tr>',
    '  <td>' + order.id + '</td>',
    '  <td>' + order.publicId + '</td>',
    '  <td>' + order.customerName + '<br><span style="color:var(--muted)">' + order.phone + '</span></td>',
    '  <td>' + (order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз') + '</td>',
    '  <td>' + money(order.total) + '</td>',
    '  <td><span class="status status--' + order.status + '">' + (STATUS_LABEL[order.status] || order.status) + '</span></td>',
    '  <td><div class="row-actions">' + (actions || '<span style="color:var(--muted)">—</span>') + '</div></td>',
    '</tr>',
  ].join('');
}

async function renderDashboard() {
  logoutButton.hidden = false;

  const [statsResult, ordersResult] = await Promise.all([
    api('GET', '/api/admin/stats'),
    api('GET', '/api/admin/orders?limit=50'),
  ]);

  if (!statsResult.ok) {
    toast('Не удалось загрузить статистику', true);
    return;
  }

  const stats = statsResult.data.stats;
  const orders = ordersResult.data.orders;

  root.innerHTML = [
    '<h1 style="margin:24px 0 0">Заказы</h1>',
    '<div class="admin-grid">',
    '  <div class="stat"><b>' + stats.ordersTotal + '</b><span>всего заказов</span></div>',
    '  <div class="stat"><b>' + stats.ordersToday + '</b><span>сегодня</span></div>',
    '  <div class="stat"><b>' + money(stats.revenue) + '</b><span>выручка</span></div>',
    '  <div class="stat"><b>' + (stats.byStatus.NEW || 0) + '</b><span>новых в очереди</span></div>',
    '</div>',
    '<table>',
    '  <thead><tr><th>ID</th><th>Номер</th><th>Клиент</th><th>Тип</th><th>Сумма</th><th>Статус</th><th>Действия</th></tr></thead>',
    '  <tbody>' + orders.map(orderRow).join('') + '</tbody>',
    '</table>',
    '<h2>Топ товаров</h2>',
    '<table><thead><tr><th>Товар</th><th>Продано</th></tr></thead><tbody>',
    stats.topProducts.map(function (product) {
      return '<tr><td>' + product.name + '</td><td>' + product.sold + '</td></tr>';
    }).join(''),
    '</tbody></table>',
    '<h2>Меню</h2>',
    '<div id="products"></div>',
  ].join('');

  root.querySelector('tbody').addEventListener('click', async function (event) {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    const id = button.getAttribute('data-id');
    const status = button.getAttribute('data-status');
    const result = await api('PATCH', '/api/admin/orders/' + id + '/status', { status: status });
    if (!result.ok) {
      toast(result.data && result.data.error ? result.data.error.message : 'Не удалось сменить статус', true);
      return;
    }
    toast('Заказ ' + id + ' → ' + (STATUS_LABEL[status] || status));
    renderDashboard();
  });

  renderProducts();
}

async function renderProducts() {
  const result = await api('GET', '/api/admin/products');
  const container = document.getElementById('products');
  if (!result.ok || !container) return;

  container.innerHTML = [
    '<table><thead><tr><th>ID</th><th>Название</th><th>Цена</th><th>В продаже</th><th>Действия</th></tr></thead><tbody>',
    result.data.products.map(function (product) {
      return [
        '<tr>',
        '  <td>' + product.id + '</td>',
        '  <td>' + product.name + '</td>',
        '  <td>' + money(product.price) + '</td>',
        '  <td>' + (product.isAvailable ? 'да' : 'нет') + '</td>',
        '  <td><button class="mini" data-toggle="' + product.id + '" data-available="' + product.isAvailable + '">' + (product.isAvailable ? 'Скрыть' : 'Вернуть') + '</button></td>',
        '</tr>',
      ].join('');
    }).join(''),
    '</tbody></table>',
  ].join('');

  container.querySelector('tbody').addEventListener('click', async function (event) {
    const button = event.target.closest('[data-toggle]');
    if (!button) return;
    const id = button.getAttribute('data-toggle');
    const available = button.getAttribute('data-available') === 'true';
    const result = available
      ? await api('DELETE', '/api/admin/products/' + id)
      : await api('PATCH', '/api/admin/products/' + id, { isAvailable: true });
    if (!result.ok) {
      toast('Не удалось изменить товар', true);
      return;
    }
    toast('Товар ' + id + ' обновлён');
    renderProducts();
  });
}

logoutButton.addEventListener('click', function () {
  localStorage.removeItem(TOKEN_KEY);
  renderLogin();
});

if (getToken()) {
  renderDashboard().catch(function () { renderLogin(); });
} else {
  renderLogin();
}
