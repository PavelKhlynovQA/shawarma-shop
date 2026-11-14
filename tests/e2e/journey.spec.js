import { test, expect } from '@playwright/test';
import { StorefrontPage } from './pages/StorefrontPage.js';
import { AuthModal } from './pages/AuthModal.js';
import { PRODUCTS, getAdminToken } from './helpers.js';

/** Двигает заказ по статусам через админский API. */
async function advanceStatus(request, publicId, statuses) {
  const token = await getAdminToken(request);
  const list = await request.get('/api/admin/orders?limit=100', { headers: { Authorization: 'Bearer ' + token } });
  const body = await list.json();
  const order = body.orders.find(function (item) { return item.publicId === publicId; });
  expect(order, 'заказ должен быть в списке админки').toBeTruthy();

  for (const status of statuses) {
    const response = await request.patch('/api/admin/orders/' + order.id + '/status', {
      headers: { Authorization: 'Bearer ' + token },
      data: { status: status },
    });
    expect(response.status(), 'переход в ' + status).toBe(200);
  }
  return order;
}

function uniquePhone() {
  // 10 цифр — минимально допустимая длина по валидации API
  const tail = String(Date.now()).slice(-9);
  return '+7' + tail;
}

test.describe('Сквозной путь покупателя', function () {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('E2E-40: вход по телефону → заказ → оплата → уведомление о готовности', async function ({ page, request }) {
    const store = new StorefrontPage(page);
    const auth = new AuthModal(page);

    await store.open();
    await store.resetCart();

    // 1. Авторизация по номеру телефона
    await auth.loginByPhone(uniquePhone());
    await expect(page.locator('.auth-chip')).toContainText('Гость');

    // 2. Кладём товар в корзину
    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    await expect(store.cartCount).toHaveText('2');

    // 3. Оформляем заказ
    const cart = await store.openCart();
    const checkout = await cart.goToCheckout();
    await checkout.fill({ customerName: 'Пётр Телефонов', phone: '+7 900 123-45-67' });
    await checkout.submit();

    // 4. Оплачиваем картой
    await expect(page.locator('#payForm')).toBeVisible();
    const publicId = (await page.locator('#payOrderId').textContent()).trim();
    await checkout.payWithCard();
    await expect(checkout.page.locator('.success h2')).toHaveText('Оплата прошла');
    await expect(checkout.page.locator('.success')).toContainText('оплачено картой');
    await expect(checkout.page.locator('.success__id')).toHaveText(publicId);

    // 5. Заказ оплачен на бэкенде
    const paid = await request.get('/api/orders/' + publicId);
    const paidBody = await paid.json();
    expect(paidBody.order.paymentStatus).toBe('PAID');
    expect(paidBody.order.cardLast4).toBe('1111');

    // 6. Админ ведёт заказ по статусам, покупатель видит уведомление
    await advanceStatus(request, publicId, ['CONFIRMED', 'COOKING', 'DELIVERING']);

    await expect(checkout.orderBanner).toBeVisible({ timeout: 15_000 });
    await expect(checkout.orderBanner).toContainText('Ваш заказ готов');
    await expect(checkout.orderBanner).toContainText('скоро будет у вас');
    await expect(checkout.trackStatus).toHaveText('В доставке');

    // 7. Тост-уведомление тоже приходит
    await expect(page.locator('.toast', { hasText: 'заказ готов и скоро будет доставлен' })).toBeVisible();

    // 8. Доводим до финала — «доставлен»
    await advanceStatus(request, publicId, ['DONE']);
    await expect(checkout.orderBanner).toContainText('Заказ доставлен', { timeout: 15_000 });
  });

  test('E2E-41: неверный код из SMS не пускает в аккаунт', async function ({ page }) {
    const store = new StorefrontPage(page);
    const auth = new AuthModal(page);

    await store.open();
    await auth.open();
    await auth.requestCode(uniquePhone());
    await auth.verify('0000');

    await expect(page.locator('.toast--error')).toContainText('Неверный код');
    await expect(auth.userChip).toHaveCount(0);
  });

  test('E2E-42: банк отклоняет карту — заказ остаётся неоплаченным', async function ({ page, request }) {
    const store = new StorefrontPage(page);

    await store.open();
    await store.resetCart();
    await store.addToCart(PRODUCTS.beef.name, { quantity: 2 });

    const checkout = await (await store.openCart()).goToCheckout();
    await checkout.fill();
    await checkout.submit();
    await expect(page.locator('#payForm')).toBeVisible();
    const publicId = (await page.locator('#payOrderId').textContent()).trim();

    await checkout.payWithCard({ cardNumber: '0000 1111 2222 3333' });

    await expect(page.locator('.toast--error')).toContainText('Банк отклонил платёж');

    const response = await request.get('/api/orders/' + publicId);
    const body = await response.json();
    expect(body.order.paymentStatus).toBe('PENDING');
  });

  test('E2E-43: «оплатить при получении» создаёт заказ без оплаты', async function ({ page }) {
    const store = new StorefrontPage(page);

    await store.open();
    await store.resetCart();
    await store.addToCart(PRODUCTS.morse.name, { quantity: 5 });

    const checkout = await (await store.openCart()).goToCheckout();
    await checkout.fill({ deliveryType: 'pickup' });
    await checkout.submit();

    await checkout.payOnDelivery();
    await expect(checkout.successId).toBeVisible();
    await expect(page.locator('.success h2')).toHaveText('Заказ принят');
    await expect(page.locator('.success')).toContainText('оплата при получении');
    await expect(checkout.trackStatus).toHaveText('Принят');
  });

  test('E2E-44: «Мои заказы» показывает оформленный заказ', async function ({ page }) {
    const store = new StorefrontPage(page);
    const auth = new AuthModal(page);

    await store.open();
    await store.resetCart();
    await auth.loginByPhone(uniquePhone());

    await store.addToCart(PRODUCTS.classic.name, { quantity: 2 });
    const checkout = await (await store.openCart()).goToCheckout();
    await checkout.fill();
    await checkout.submit();
    await checkout.payOnDelivery();
    const publicId = (await page.locator('.success__id').textContent()).trim();

    await page.locator('button[data-close-checkout]').click();
    await page.locator('#myOrdersBtn').click();

    await expect(page.locator('#ordersBody')).toContainText(publicId);
  });
});
