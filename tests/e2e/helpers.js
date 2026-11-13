import { expect } from '@playwright/test';

export const PRODUCTS = {
  classic: { name: 'Шаурма классическая', price: 280 },
  beef: { name: 'Шаурма с говядиной', price: 340 },
  cheeseShaurma: { name: 'Шаурма сырная', price: 320 },
  cheeseDoner: { name: 'Донер с сыром', price: 330 },
  sauce: { name: 'Соус чесночный', price: 40 },
  morse: { name: 'Морс клюквенный', price: 110 },
  cola: { name: 'Кола 0.5', price: 120 },
};

export const EXTRAS = {
  doubleMeat: { name: 'Двойное мясо', price: 120 },
  cheese: { name: 'Дополнительный сыр', price: 50 },
  jalapeno: { name: 'Халапеньо', price: 30 },
};

/** Открывает витрину и ждёт прогрузки меню. */
export async function openStore(page) {
  await page.goto('/');
  await expect(page.locator('.card').first()).toBeVisible();
}

/** Открывает модалку товара по точному названию. */
export async function openProduct(page, productName) {
  const card = page.locator('.card').filter({ has: page.getByRole('heading', { name: new RegExp('^' + escapeRegExp(productName)) }) });
  await card.locator('[data-add]').click();
  await expect(page.locator('#productModalBody')).toBeVisible();
}

/** Добавляет товар в корзину, опционально с дополнителями и количеством. */
export async function addToCart(page, productName, options = {}) {
  await openProduct(page, productName);

  const quantity = options.quantity || 1;
  for (let i = 1; i < quantity; i++) {
    await page.locator('#productModalBody [data-qty="1"]').click();
  }

  for (const extraName of options.extras || []) {
    await page.locator('#productModalBody .chip', { hasText: extraName }).click();
  }

  await page.locator('#modalAdd').click();
  await expect(page.locator('#productModalBody')).toBeHidden();
}

export async function openCart(page) {
  await page.locator('#cartButton').click();
  await expect(page.locator('#cartDrawer')).toBeVisible();
}

export async function goToCheckout(page) {
  await openCart(page);
  await page.locator('#goCheckout').click();
  await expect(page.locator('#checkoutForm')).toBeVisible();
}

export async function fillCheckoutForm(page, data = {}) {
  const form = page.locator('#checkoutForm');
  await form.locator('[name=customerName]').fill(data.customerName ?? 'Иван Тестов');
  await form.locator('[name=phone]').fill(data.phone ?? '+7 900 123-45-67');

  const deliveryType = data.deliveryType ?? 'delivery';
  await form.locator('[name=deliveryType]').selectOption(deliveryType);

  if (deliveryType === 'delivery') {
    await form.locator('[name=address]').fill(data.address ?? 'Волгоград, ул. Мира, 15');
  }
  if (data.comment) {
    await form.locator('[name=comment]').fill(data.comment);
  }
}

export async function submitCheckout(page) {
  await page.locator('#checkoutForm button[type=submit]').click();
}

/** Создаёт заказ через API — нужно для тестов админки. */
export async function createOrderViaApi(request, overrides = {}) {
  const response = await request.post('/api/orders', {
    data: Object.assign(
      {
        customerName: 'API Тест',
        phone: '+7 900 111-22-33',
        deliveryType: 'delivery',
        address: 'Волгоград, ул. Тестовая, 1',
        items: [{ productId: 1, quantity: 2 }],
      },
      overrides
    ),
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.order;
}

export async function loginAsAdmin(page) {
  await page.goto('/admin');
  await page.locator('#email').fill('admin@shawarma.ru');
  await page.locator('#password').fill('Admin123!');
  await page.locator('#loginButton').click();
  await expect(page.locator('.stat').first()).toBeVisible();
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
}
