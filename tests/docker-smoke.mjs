const BASE = 'http://localhost:3000';
async function call(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, json, raw: text.slice(0, 200) };
}
const health = await call('GET', '/api/health');
console.log('health:', health.raw);
const menu = await call('GET', '/api/menu');
console.log('menu:', menu.status, 'категорий', menu.json.categories.length);
const login = await call('POST', '/api/auth/login', { email: 'admin@shawarma.ru', password: 'Admin123!' });
console.log('login admin:', login.status);
const order = await call('POST', '/api/orders', {
  customerName: 'Иван Тестов', phone: '+7 900 123-45-67', deliveryType: 'delivery',
  address: 'Волгоград, ул. Мира, 15', promoCode: 'SHAWARMA10',
  items: [{ productId: 1, quantity: 2, extraIds: [1, 2] }],
});
console.log('order:', order.status, order.raw);
const stats = await call('GET', '/api/admin/stats', null, login.json.token);
console.log('stats:', stats.raw);
