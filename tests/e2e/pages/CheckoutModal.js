import { expect } from '@playwright/test';

/** Модальное окно оформления заказа и экран успеха. */
export class CheckoutModal {
  constructor(page) {
    this.page = page;
    this.root = page.locator('#checkoutModal');
    this.form = page.locator('#checkoutForm');
    this.total = page.locator('#checkoutTotal');
    this.addressField = page.locator('#addressField');
    this.applyPromoButton = page.locator('#applyPromo');

    this.success = page.locator('.success');
    this.successId = page.locator('.success__id');
    this.statusLine = page.locator('.status-line');
  }

  field(name) {
    return this.form.locator('[name=' + name + ']');
  }

  async fill(data = {}) {
    const values = Object.assign(
      {
        customerName: 'Иван Тестов',
        phone: '+7 900 123-45-67',
        deliveryType: 'delivery',
        address: 'Волгоград, ул. Мира, 15',
      },
      data
    );

    await this.field('customerName').fill(values.customerName);
    await this.field('phone').fill(values.phone);
    await this.field('deliveryType').selectOption(values.deliveryType);

    if (values.deliveryType === 'delivery') {
      await this.field('address').fill(values.address);
    }
    if (values.comment) {
      await this.field('comment').fill(values.comment);
    }
    return this;
  }

  async applyPromo(code) {
    await this.field('promoCode').fill(code);
    await this.applyPromoButton.click();
  }

  async submit() {
    await this.form.locator('button[type=submit]').click();
  }

  async expectSuccess() {
    await expect(this.successId).toBeVisible();
    return this;
  }

  /** Форма оплаты картой (появляется после создания заказа). */
  async payWithCard(data = {}) {
    const form = this.page.locator('#payForm');
    await expect(form).toBeVisible();

    const values = Object.assign(
      { cardNumber: '4111 1111 1111 1111', cardHolder: 'IVAN IVANOV', expiry: '12/30', cvv: '123' },
      data
    );

    await form.locator('[name=cardNumber]').fill(values.cardNumber);
    await form.locator('[name=cardHolder]').fill(values.cardHolder);
    await form.locator('[name=expiry]').fill(values.expiry);
    await form.locator('[name=cvv]').fill(values.cvv);
    await this.page.locator('#payButton').click();
    return this;
  }

  async payOnDelivery() {
    await this.page.locator('#skipPay').click();
    return this;
  }

  get trackStatus() {
    return this.page.locator('#trackStatus');
  }

  get orderBanner() {
    return this.page.locator('#orderBanner');
  }
}
