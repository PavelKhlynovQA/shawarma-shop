// Демонстрационный прогон сквозного сценария с видимым браузером и скриншотами.
// Запуск: node scripts/journey-demo.mjs  (или npm run demo:journey)
import { chromium } from 'playwright-core';
import { StorefrontPage } from '../tests/e2e/pages/StorefrontPage.js';
import { AuthModal } from '../tests/e2e/pages/AuthModal.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SHOTS = 'docs/screenshots';
const SLOW = Number(process.env.SLOW_MO || 700);

async function adminApi(path, options = {}) {
  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shawarma.ru', password: 'Admin123!' }),
  });
  const { token } = await login.json();
  const response = await fetch(BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, ...(options.headers || {}) },
  });
  return response.json();
}

const browser = await chromium.launch({ headless: false, slowMo: SLOW });
const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 }, locale: 'ru-RU' });
const page = await context.newPage();

const store = new StorefrontPage(page);
const auth = new AuthModal(page);

console.log('1. Открываем витрину');
await store.open();
await store.resetCart();

console.log('2. Входим по номеру телефона');
await auth.open();
await page.locator('#authBody [name=phone]').fill('+7 900 777-66-55');
await page.screenshot({ path: SHOTS + '/journey-1-phone.png' });
await page.locator('#sendCodeBtn').click();
await page.locator('#authBody [name=code]').waitFor();
const code = (await page.locator('#demoCode').textContent()).trim();
console.log('   демо-код:', code);
await page.locator('#authBody [name=code]').fill(code);
await page.locator('#verifyCodeBtn').click();
await page.locator('.auth-chip').waitFor();
await page.screenshot({ path: SHOTS + '/journey-2-logged-in.png' });

console.log('3. Собираем корзину');
await store.addToCart('Шаурма классическая', { quantity: 2 });
await store.addToCart('Кола 0.5');
await page.waitForTimeout(500);

console.log('4. Оформляем заказ');
const cart = await store.openCart();
const checkout = await cart.goToCheckout();
await checkout.fill({ customerName: 'Пётр Телефонов', phone: '+7 900 777-66-55' });
await checkout.submit();

console.log('5. Оплачиваем картой');
await page.locator('#payForm').waitFor();
const publicId = (await page.locator('#payOrderId').textContent()).trim();
await page.locator('#payForm [name=cardNumber]').fill('4111 1111 1111 1111');
await page.locator('#payForm [name=cardHolder]').fill('PETR TELEFONOV');
await page.locator('#payForm [name=expiry]').fill('12/30');
await page.locator('#payForm [name=cvv]').fill('123');
await page.screenshot({ path: SHOTS + '/journey-3-payment.png' });
await page.locator('#payButton').click();
await page.locator('.success__id').waitFor();
console.log('   заказ', publicId, 'оплачен');
await page.screenshot({ path: SHOTS + '/journey-4-paid.png' });

console.log('6. Админ ведёт заказ: CONFIRMED -> COOKING -> DELIVERING');
const list = await adminApi('/api/admin/orders?limit=100');
const order = list.orders.find(function (o) { return o.publicId === publicId; });
for (const status of ['CONFIRMED', 'COOKING', 'DELIVERING']) {
  await adminApi('/api/admin/orders/' + order.id + '/status', { method: 'PATCH', body: JSON.stringify({ status: status }) });
  console.log('   статус ->', status);
  await page.waitForTimeout(1200);
}

console.log('7. Ждём уведомление у покупателя');
await page.locator('#orderBanner').waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({ path: SHOTS + '/journey-5-ready.png' });
console.log('   уведомление:', (await page.locator('#orderBanner').innerText()).replace(/\n/g, ' '));

await page.waitForTimeout(2500);
await browser.close();
console.log('Готово. Скриншоты в', SHOTS);
