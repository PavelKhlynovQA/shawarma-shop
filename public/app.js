// Витрина магазина. Ванильный JS без сборки — чтобы проект запускался одной командой.

const API = '';
const CART_KEY = 'shawarma_cart_v1';

const state = {
  menu: [],
  extras: [],
  cart: [],
  activeCategory: null,
  promo: null,
  modalProduct: null,
  modalExtras: [],
  modalQuantity: 1,
  token: null,
  user: null,
  phone: null,
  trackingTimer: null,
  lastStatus: null,
};

const AUTH_KEY = 'shawarma_auth_v1';
const STATUS_LABELS = { NEW: 'Принят', CONFIRMED: 'Подтверждён', COOKING: 'Готовится', DELIVERING: 'В доставке', DONE: 'Доставлен', CANCELLED: 'Отменён' };
const STATUS_FLOW = ['NEW', 'CONFIRMED', 'COOKING', 'DELIVERING', 'DONE'];

const el = {
  tabs: document.getElementById('categoryTabs'),
  menu: document.getElementById('menu'),
  menuEmpty: document.getElementById('menuEmpty'),
  cartButton: document.getElementById('cartButton'),
  cartCount: document.getElementById('cartCount'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartItems: document.getElementById('cartItems'),
  cartFooter: document.getElementById('cartFooter'),
  productModal: document.getElementById('productModal'),
  productModalBody: document.getElementById('productModalBody'),
  checkoutModal: document.getElementById('checkoutModal'),
  checkoutBody: document.getElementById('checkoutBody'),
  toasts: document.getElementById('toasts'),
  authArea: document.getElementById('authArea'),
  authModal: document.getElementById('authModal'),
  authBody: document.getElementById('authBody'),
  ordersModal: document.getElementById('ordersModal'),
  ordersBody: document.getElementById('ordersBody'),
};

function money(value) {
  return value.toLocaleString('ru-RU') + ' ₽';
}

async function api(method, path, body) {
  const options = { method: method, headers: { 'Content-Type': 'application/json' } };
  if (state.token) options.headers.Authorization = 'Bearer ' + state.token;
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(API + path, options);
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  return { ok: response.ok, status: response.status, data: data };
}

function toast(message, isError) {
  const node = document.createElement('div');
  node.className = 'toast' + (isError ? ' toast--error' : '');
  node.textContent = message;
  el.toasts.appendChild(node);
  setTimeout(function () { node.remove(); }, 3200);
}

// ---------- Авторизация по телефону ----------

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.token = data.token;
    state.user = data.user;
  } catch (error) {
    state.token = null;
    state.user = null;
  }
}

function saveAuth(token, user) {
  state.token = token;
  state.user = user;
  if (token) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: token, user: user }));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
  renderAuthArea();
}

function renderAuthArea() {
  if (!el.authArea) return;
  if (state.user) {
    el.authArea.innerHTML = [
      '<span class="auth-chip">👤 <b>' + escapeHtml(state.user.name) + '</b></span>',
      '<button class="btn btn--ghost" id="myOrdersBtn" type="button">Мои заказы</button>',
      '<button class="btn btn--ghost" id="logoutBtn" type="button">Выйти</button>',
    ].join('');
  } else {
    el.authArea.innerHTML = '<button class="btn btn--ghost" id="loginBtn" type="button">Войти</button>';
  }
}

function openAuthModal() {
  el.authBody.innerHTML = [
    '<h2>Вход по телефону</h2>',
    '<p class="card__desc">Отправим код подтверждения — пароль не нужен</p>',
    '<div class="field"><label>Номер телефона</label><input name="phone" placeholder="+7 900 000-00-00" /></div>',
    '<button class="btn btn--block" id="sendCodeBtn" type="button">Получить код</button>',
  ].join('');

  el.authModal.hidden = false;
  const phoneInput = el.authBody.querySelector('[name=phone]');
  phoneInput.focus();

  el.authBody.querySelector('#sendCodeBtn').addEventListener('click', async function () {
    const result = await api('POST', '/api/auth/phone/request-code', { phone: phoneInput.value.trim() });
    if (!result.ok) {
      toast(result.data && result.data.error ? result.data.error.message : 'Не удалось отправить код', true);
      return;
    }
    state.phone = result.data.phone;
    renderAuthCodeStep(result.data.debugCode);
  });
}

function renderAuthCodeStep(debugCode) {
  el.authBody.innerHTML = [
    '<h2>Введите код из SMS</h2>',
    '<p class="card__desc">Код отправлен на номер ' + escapeHtml(state.phone) + '</p>',
    '<div class="field"><label>Код</label><input name="code" inputmode="numeric" maxlength="4" placeholder="0000" /></div>',
    debugCode ? '<div class="hint">Демо-режим: SMS не отправляется, ваш код — <code id="demoCode">' + debugCode + '</code></div>' : '',
    '<button class="btn btn--block" id="verifyCodeBtn" type="button" style="margin-top:12px">Войти</button>',
  ].join('');

  const codeInput = el.authBody.querySelector('[name=code]');
  codeInput.focus();

  el.authBody.querySelector('#verifyCodeBtn').addEventListener('click', async function () {
    const result = await api('POST', '/api/auth/phone/verify', { phone: state.phone, code: codeInput.value.trim() });
    if (!result.ok) {
      toast(result.data && result.data.error ? result.data.error.message : 'Неверный код', true);
      return;
    }
    saveAuth(result.data.token, result.data.user);
    el.authModal.hidden = true;
    toast('Добро пожаловать, ' + result.data.user.name);
  });
}

async function openOrdersModal() {
  el.ordersModal.hidden = false;
  el.ordersBody.innerHTML = '<h2>Мои заказы</h2><p class="card__desc">Загрузка…</p>';

  const result = await api('GET', '/api/orders');
  if (!result.ok) {
    el.ordersBody.innerHTML = '<h2>Мои заказы</h2><p class="card__desc">Не удалось загрузить</p>';
    return;
  }

  const orders = result.data.orders;
  el.ordersBody.innerHTML = [
    '<h2>Мои заказы</h2>',
    orders.length
      ? orders.map(function (order) {
          return [
            '<div class="cart-row" style="margin-bottom:8px">',
            '  <div class="cart-row__main">',
            '    <div class="cart-row__title">' + order.publicId + '</div>',
            '    <div class="cart-row__sub">' + STATUS_LABELS[order.status] + ' · ' + new Date(order.createdAt).toLocaleString('ru-RU') + '</div>',
            '  </div>',
            '  <div class="cart-row__price">' + money(order.total) + '</div>',
            '</div>',
          ].join('');
        }).join('')
      : '<p class="card__desc">Пока нет заказов</p>',
    '<button class="btn btn--ghost btn--block" data-close-orders type="button" style="margin-top:10px">Закрыть</button>',
  ].join('');
}

// ---------- Оплата ----------

function renderPaymentStep(order) {
  stopTracking();
  el.checkoutBody.innerHTML = [
    '<h2>Оплата заказа</h2>',
    '<p class="card__desc">Заказ <b id="payOrderId">' + order.publicId + '</b> · к оплате <b>' + money(order.total) + '</b></p>',
    '<div class="pay-card">',
    '  <div class="pay-card__number">•••• •••• •••• ••••</div>',
    '  <p class="card__desc" style="margin-top:8px">Тестовая карта: <b>4111 1111 1111 1111</b>, срок 12/30, CVV 123</p>',
    '</div>',
    '<form id="payForm">',
    '  <div class="field"><label>Номер карты</label><input name="cardNumber" inputmode="numeric" placeholder="0000 0000 0000 0000" /></div>',
    '  <div class="field"><label>Владелец карты</label><input name="cardHolder" placeholder="IVAN IVANOV" /></div>',
    '  <div class="row2">',
    '    <div class="field"><label>Срок</label><input name="expiry" placeholder="ММ/ГГ" maxlength="5" /></div>',
    '    <div class="field"><label>CVV</label><input name="cvv" type="password" maxlength="3" placeholder="•••" /></div>',
    '  </div>',
    '  <button class="btn btn--block" type="submit" id="payButton">Оплатить ' + money(order.total) + '</button>',
    '</form>',
    '<button class="btn btn--ghost btn--block" id="skipPay" type="button" style="margin-top:8px">Оплатить при получении</button>',
  ].join('');

  const form = el.checkoutBody.querySelector('#payForm');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const data = new FormData(form);
    const button = el.checkoutBody.querySelector('#payButton');
    button.disabled = true;
    button.textContent = 'Проводим платёж…';

    const result = await api('POST', '/api/orders/' + order.publicId + '/pay', {
      cardNumber: String(data.get('cardNumber') || ''),
      cardHolder: String(data.get('cardHolder') || ''),
      expiry: String(data.get('expiry') || ''),
      cvv: String(data.get('cvv') || ''),
    });

    if (!result.ok) {
      button.disabled = false;
      button.textContent = 'Оплатить ' + money(order.total);
      const error = result.data && result.data.error;
      let message = error ? error.message : 'Платёж не прошёл';
      if (error && error.details && error.details.length) {
        message = error.details.map(function (d) { return d.message; }).join('; ');
      }
      toast(message, true);
      return;
    }

    renderOrderSuccess(result.data.order, true);
  });

  el.checkoutBody.querySelector('#skipPay').addEventListener('click', function () {
    renderOrderSuccess(order, false);
  });
}

// ---------- Экран заказа и отслеживание ----------

function renderOrderSuccess(order, paid) {
  state.lastStatus = order.status;
  el.checkoutBody.innerHTML = [
    '<div class="success">',
    '  <div class="success__icon">' + (paid ? '💳' : '✅') + '</div>',
    '  <h2>' + (paid ? 'Оплата прошла' : 'Заказ принят') + '</h2>',
    '  <div class="success__id">' + order.publicId + '</div>',
    '  <p class="card__desc">' + money(order.total) + ' · ' + (paid ? 'оплачено картой •' + (order.cardLast4 || '') : 'оплата при получении') + '</p>',
    '</div>',
    '<div class="track">',
    '  <div class="track__steps" id="trackSteps"></div>',
    '  <div class="status-line">Статус: <b id="trackStatus">' + (STATUS_LABELS[order.status] || order.status) + '</b></div>',
    '</div>',
    '<div class="order-banner" id="orderBanner" hidden></div>',
    '<p class="card__desc" style="text-align:center">Следим за статусом автоматически — обновляется каждые 2 секунды</p>',
    '<button class="btn btn--block" data-close-checkout type="button">Отлично</button>',
  ].join('');

  paintTrackSteps(order.status);
  startTracking(order.publicId);
}

function paintTrackSteps(status) {
  const stepsNode = document.getElementById('trackSteps');
  if (!stepsNode) return;
  const currentIndex = STATUS_FLOW.indexOf(status);
  stepsNode.innerHTML = STATUS_FLOW.map(function (step, index) {
    const cls = index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : '';
    return '<div class="track__step ' + cls + '"></div>';
  }).join('');
}

function startTracking(publicId) {
  stopTracking();
  state.trackingTimer = setInterval(function () { refreshTracking(publicId); }, 2000);
}

function stopTracking() {
  if (state.trackingTimer) {
    clearInterval(state.trackingTimer);
    state.trackingTimer = null;
  }
}

async function refreshTracking(publicId) {
  const result = await api('GET', '/api/orders/' + publicId);
  if (!result.ok) return;

  const order = result.data.order;
  const previous = state.lastStatus;
  state.lastStatus = order.status;

  const statusNode = document.getElementById('trackStatus');
  if (statusNode) statusNode.textContent = STATUS_LABELS[order.status] || order.status;
  paintTrackSteps(order.status);

  const banner = document.getElementById('orderBanner');
  if (!banner) return;

  if (order.status === 'DELIVERING') {
    banner.className = 'order-banner';
    banner.innerHTML = '<b>Ваш заказ готов!</b>Курьер забрал его и скоро будет у вас. Ожидайте звонка.';
    banner.hidden = false;
    if (previous !== 'DELIVERING') {
      toast('🔔 Ваш заказ готов и скоро будет доставлен');
    }
  } else if (order.status === 'DONE') {
    banner.className = 'order-banner done-banner';
    banner.innerHTML = '<b>Заказ доставлен</b>Спасибо, что выбрали Шаурма-Мастер!';
    banner.hidden = false;
  }
}

// ---------- Корзина ----------

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    state.cart = raw ? JSON.parse(raw) : [];
  } catch (error) {
    state.cart = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  renderCartCount();
}

function renderCartCount() {
  const total = state.cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
  el.cartCount.textContent = String(total);
}

function cartSubtotal() {
  return state.cart.reduce(function (sum, item) {
    const extrasSum = item.extras.reduce(function (s, e) { return s + e.price; }, 0);
    return sum + (item.price + extrasSum) * item.quantity;
  }, 0);
}

function addToCart(product, quantity, extras) {
  const extraIds = extras.map(function (e) { return e.id; }).sort(function (a, b) { return a - b; });
  const key = product.id + '|' + extraIds.join(',');
  const existing = state.cart.find(function (item) { return item.key === key; });
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({
      key: key,
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      price: product.price,
      quantity: quantity,
      extras: extras,
    });
  }
  saveCart();
  renderCart();
  toast(product.name + ' — в корзине');
}

// ---------- Меню ----------

function renderTabs() {
  const items = [];
  items.push('<button class="tab ' + (state.activeCategory === null ? 'is-active' : '') + '" data-category="all">Всё меню</button>');
  state.menu.forEach(function (category) {
    items.push('<button class="tab ' + (state.activeCategory === category.id ? 'is-active' : '') + '" data-category="' + category.id + '">' + category.name + '</button>');
  });
  el.tabs.innerHTML = items.join('');
}

function productCard(product) {
  const media = product.imageUrl
    ? '<img class="card__img" src="' + product.imageUrl + '" alt="' + escapeHtml(product.name) + '" loading="lazy" />'
    : '<div class="card__emoji">' + (product.emoji || '🌯') + '</div>';

  return [
    '<article class="card" data-product="' + product.id + '">',
    media,
    '  <div class="card__body">',
    '    <h3 class="card__name">' + product.name + (product.isSpicy ? ' <span class="spicy">🌶</span>' : '') + '</h3>',
    '    <p class="card__desc">' + (product.description || '') + '</p>',
    '    <div class="card__meta"><span>' + (product.weightG ? product.weightG + ' г' : '') + '</span></div>',
    '    <div class="card__foot">',
    '      <span class="card__price">' + money(product.price) + '</span>',
    '      <button class="btn" data-add="' + product.id + '">В корзину</button>',
    '    </div>',
    '  </div>',
    '</article>',
  ].join('');
}

function renderMenu() {
  renderTabs();
  const products = [];
  state.menu.forEach(function (category) {
    if (state.activeCategory !== null && state.activeCategory !== category.id) return;
    category.products.forEach(function (product) { products.push(product); });
  });

  if (!products.length) {
    el.menu.innerHTML = '';
    el.menuEmpty.hidden = false;
    el.menuEmpty.textContent = 'В этой категории пока нет товаров';
    return;
  }

  el.menuEmpty.hidden = true;
  el.menu.innerHTML = products.map(productCard).join('');
}

// ---------- Модалка товара ----------

function openProduct(productId) {
  let product = null;
  state.menu.forEach(function (category) {
    category.products.forEach(function (item) { if (item.id === productId) product = item; });
  });
  if (!product) return;

  state.modalProduct = product;
  state.modalExtras = [];
  state.modalQuantity = 1;

  el.productModalBody.innerHTML = [
    product.imageUrl ? '<img class="modal__img" src="' + product.imageUrl + '" alt="' + escapeHtml(product.name) + '" />' : '',
    '<h2>' + product.emoji + ' ' + product.name + '</h2>',
    '<p class="card__desc">' + (product.description || '') + '</p>',
    '<div class="field"><label>Количество</label>',
    '  <div class="qty">',
    '    <button data-qty="-1">−</button>',
    '    <span id="modalQty">1</span>',
    '    <button data-qty="1">+</button>',
    '  </div>',
    '</div>',
    '<div class="field"><label>Добавить</label><div class="chips">',
    state.extras.map(function (extra) {
      return '<button class="chip" data-extra="' + extra.id + '">' + extra.name + ' +' + extra.price + ' ₽</button>';
    }).join(''),
    '</div></div>',
    '<div class="summary summary--total"><span>Итого</span><span id="modalTotal">' + money(product.price) + '</span></div>',
    '<button class="btn btn--block" id="modalAdd" style="margin-top:14px">Добавить в корзину</button>',
  ].join('');

  el.productModal.hidden = false;
  updateModalTotal();
}

function updateModalTotal() {
  const product = state.modalProduct;
  if (!product) return;
  const extrasSum = state.modalExtras.reduce(function (sum, extra) { return sum + extra.price; }, 0);
  const total = (product.price + extrasSum) * state.modalQuantity;
  const qtyNode = document.getElementById('modalQty');
  const totalNode = document.getElementById('modalTotal');
  if (qtyNode) qtyNode.textContent = String(state.modalQuantity);
  if (totalNode) totalNode.textContent = money(total);
}

// ---------- Корзина: отрисовка ----------

function renderCart() {
  if (!state.cart.length) {
    el.cartItems.innerHTML = '<p class="empty">Корзина пуста</p>';
    el.cartFooter.innerHTML = '';
    return;
  }

  el.cartItems.innerHTML = state.cart.map(function (item) {
    const extrasSum = item.extras.reduce(function (s, e) { return s + e.price; }, 0);
    const linePrice = (item.price + extrasSum) * item.quantity;
    const extrasLabel = item.extras.length
      ? item.extras.map(function (e) { return e.name; }).join(', ')
      : '';
    return [
      '<div class="cart-row">',
      '  <div class="cart-row__emoji">' + (item.emoji || '🌯') + '</div>',
      '  <div class="cart-row__main">',
      '    <div class="cart-row__title">' + item.name + '</div>',
      extrasLabel ? '    <div class="cart-row__sub">+ ' + extrasLabel + '</div>' : '',
      '    <div class="qty">',
      '      <button data-dec="' + item.key + '">−</button>',
      '      <span>' + item.quantity + '</span>',
      '      <button data-inc="' + item.key + '">+</button>',
      '      <button data-del="' + item.key + '" style="margin-left:8px;width:auto;padding:0 8px">Удалить</button>',
      '    </div>',
      '  </div>',
      '  <div class="cart-row__price">' + money(linePrice) + '</div>',
      '</div>',
    ].join('');
  }).join('');

  const subtotal = cartSubtotal();
  const discount = state.promo ? Math.floor((subtotal * state.promo.discountPercent) / 100) : 0;

  el.cartFooter.innerHTML = [
    '<div class="summary"><span>Сумма</span><span>' + money(subtotal) + '</span></div>',
    discount ? '<div class="summary summary--discount"><span>Скидка ' + state.promo.code + '</span><span>−' + money(discount) + '</span></div>' : '',
    '<div class="summary summary--total"><span>Итого</span><span>' + money(subtotal - discount) + '</span></div>',
    '<button class="btn btn--block" id="goCheckout">Оформить заказ</button>',
  ].join('');
}

// ---------- Оформление ----------

function openCheckout() {
  if (!state.cart.length) {
    toast('Корзина пуста', true);
    return;
  }
  const subtotal = cartSubtotal();
  el.checkoutBody.innerHTML = [
    '<h2>Оформление заказа</h2>',
    '<form id="checkoutForm">',
    '  <div class="field"><label>Имя *</label><input name="customerName" placeholder="Как к вам обращаться" /></div>',
    '  <div class="field"><label>Телефон *</label><input name="phone" placeholder="+7 900 000-00-00" /></div>',
    '  <div class="field"><label>Способ получения</label>',
    '    <select name="deliveryType"><option value="delivery">Доставка</option><option value="pickup">Самовывоз</option></select>',
    '  </div>',
    '  <div class="field" id="addressField"><label>Адрес доставки *</label><input name="address" placeholder="Улица, дом, квартира" /></div>',
    '  <div class="field"><label>Комментарий</label><textarea name="comment" rows="2" placeholder="Без лука, острый соус отдельно…"></textarea></div>',
    '  <div class="field"><label>Промокод</label>',
    '    <div style="display:flex;gap:8px"><input name="promoCode" placeholder="SHAWARMA10" /><button type="button" class="btn btn--ghost" id="applyPromo">Применить</button></div>',
    '  </div>',
    '  <div class="summary summary--total"><span>К оплате</span><span id="checkoutTotal">' + money(subtotal - (state.promo ? Math.floor(subtotal * state.promo.discountPercent / 100) : 0)) + '</span></div>',
    '  <button class="btn btn--block" type="submit" style="margin-top:14px">Подтвердить заказ</button>',
    '</form>',
  ].join('');

  el.checkoutModal.hidden = false;

  const form = document.getElementById('checkoutForm');
  const deliverySelect = form.querySelector('[name=deliveryType]');
  deliverySelect.addEventListener('change', function () {
    document.getElementById('addressField').style.display = deliverySelect.value === 'delivery' ? '' : 'none';
  });

  document.getElementById('applyPromo').addEventListener('click', async function () {
    const code = form.querySelector('[name=promoCode]').value.trim();
    if (!code) return;
    const result = await api('POST', '/api/promo/validate', { code: code, subtotal: cartSubtotal() });
    if (!result.ok) {
      state.promo = null;
      toast(result.data && result.data.error ? result.data.error.message : 'Промокод не применён', true);
      return;
    }
    state.promo = result.data.promo;
    toast('Промокод ' + state.promo.code + ': −' + state.promo.discount + ' ₽');
    document.getElementById('checkoutTotal').textContent = money(state.promo.total);
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      customerName: String(formData.get('customerName') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      deliveryType: formData.get('deliveryType'),
      address: String(formData.get('address') || '').trim(),
      comment: String(formData.get('comment') || '').trim(),
      promoCode: state.promo ? state.promo.code : null,
      items: state.cart.map(function (item) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          extraIds: item.extras.map(function (e) { return e.id; }),
        };
      }),
    };

    const result = await api('POST', '/api/orders', payload);
    if (!result.ok) {
      const error = result.data && result.data.error;
      let message = error ? error.message : 'Не удалось создать заказ';
      if (error && error.details && error.details.length) {
        message = error.details.map(function (d) { return d.field + ': ' + d.message; }).join('; ');
      }
      toast(message, true);
      return;
    }

    const order = result.data.order;
    state.cart = [];
    state.promo = null;
    saveCart();
    renderCart();

    renderPaymentStep(order);
  });
}

// ---------- События ----------

el.tabs.addEventListener('click', function (event) {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  const value = button.getAttribute('data-category');
  state.activeCategory = value === 'all' ? null : Number(value);
  renderMenu();
});

el.menu.addEventListener('click', function (event) {
  const addButton = event.target.closest('[data-add]');
  if (addButton) {
    openProduct(Number(addButton.getAttribute('data-add')));
    return;
  }
  const card = event.target.closest('[data-product]');
  if (card) openProduct(Number(card.getAttribute('data-product')));
});

el.cartButton.addEventListener('click', function () {
  renderCart();
  el.cartDrawer.hidden = false;
});

document.addEventListener('click', function (event) {
  if (event.target.closest('[data-close-cart]')) el.cartDrawer.hidden = true;
  if (event.target.closest('[data-close-modal]')) el.productModal.hidden = true;
  if (event.target.closest('[data-close-checkout]')) {
    stopTracking();
    el.checkoutModal.hidden = true;
  }
  if (event.target.closest('[data-close-auth]')) el.authModal.hidden = true;
  if (event.target.closest('[data-close-orders]')) el.ordersModal.hidden = true;

  if (event.target.closest('#loginBtn')) openAuthModal();
  if (event.target.closest('#myOrdersBtn')) openOrdersModal();
  if (event.target.closest('#logoutBtn')) {
    saveAuth(null, null);
    toast('Вы вышли из аккаунта');
  }
});

el.productModalBody.addEventListener('click', function (event) {
  const qtyButton = event.target.closest('[data-qty]');
  if (qtyButton) {
    state.modalQuantity = Math.max(1, state.modalQuantity + Number(qtyButton.getAttribute('data-qty')));
    updateModalTotal();
    return;
  }

  const extraButton = event.target.closest('[data-extra]');
  if (extraButton) {
    const id = Number(extraButton.getAttribute('data-extra'));
    const index = state.modalExtras.findIndex(function (extra) { return extra.id === id; });
    if (index === -1) {
      const extra = state.extras.find(function (e) { return e.id === id; });
      state.modalExtras.push(extra);
      extraButton.classList.add('is-on');
    } else {
      state.modalExtras.splice(index, 1);
      extraButton.classList.remove('is-on');
    }
    updateModalTotal();
    return;
  }

  if (event.target.closest('#modalAdd')) {
    addToCart(state.modalProduct, state.modalQuantity, state.modalExtras.slice());
    el.productModal.hidden = true;
  }
});

el.cartItems.addEventListener('click', function (event) {
  const inc = event.target.closest('[data-inc]');
  const dec = event.target.closest('[data-dec]');
  const del = event.target.closest('[data-del]');

  if (inc) {
    const item = state.cart.find(function (i) { return i.key === inc.getAttribute('data-inc'); });
    if (item) item.quantity += 1;
  } else if (dec) {
    const key = dec.getAttribute('data-dec');
    const item = state.cart.find(function (i) { return i.key === key; });
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) state.cart = state.cart.filter(function (i) { return i.key !== key; });
    }
  } else if (del) {
    state.cart = state.cart.filter(function (i) { return i.key !== del.getAttribute('data-del'); });
  } else {
    return;
  }

  saveCart();
  renderCart();
});

el.cartFooter.addEventListener('click', function (event) {
  if (event.target.closest('#goCheckout')) {
    el.cartDrawer.hidden = true;
    openCheckout();
  }
});

// ---------- Старт ----------

async function bootstrap() {
  loadCart();
  loadAuth();
  renderAuthArea();
  renderCartCount();

  const [menuResult, extrasResult] = await Promise.all([api('GET', '/api/menu'), api('GET', '/api/extras')]);

  if (!menuResult.ok) {
    el.menuEmpty.hidden = false;
    el.menuEmpty.textContent = 'Не удалось загрузить меню. Обновите страницу.';
    return;
  }

  state.menu = menuResult.data.categories;
  state.extras = extrasResult.ok ? extrasResult.data.extras : [];
  renderMenu();
}

bootstrap();
