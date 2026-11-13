import { expect } from '@playwright/test';

/** Справочник товаров из сидов — чтобы тесты не зависели от порядка id. */
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

export const ADMIN = { email: 'admin@shawarma.ru', password: 'Admin123!' };
export const CUSTOMER = { email: 'customer@test.ru', password: 'Test123!' };

/** Создаёт заказ через API — нужно для тестов админки и предзаполнения данных. */
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

export async function getAdminToken(request) {
  const response = await request.post('/api/auth/login', { data: ADMIN });
  const body = await response.json();
  return body.token;
}
