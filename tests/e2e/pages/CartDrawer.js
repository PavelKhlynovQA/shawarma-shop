import { expect } from '@playwright/test';
import { CheckoutModal } from './CheckoutModal.js';

/** Выдвижная корзина. */
export class CartDrawer {
  constructor(page) {
    this.page = page;
    this.root = page.locator('#cartDrawer');
    this.items = page.locator('#cartItems');
    this.rows = page.locator('.cart-row');
    this.footer = page.locator('#cartFooter');
    this.checkoutButton = page.locator('#goCheckout');
    this.emptyText = this.items.getByText('Корзина пуста');
  }

  async waitForOpen() {
    await expect(this.root).toBeVisible();
    return this;
  }

  rowByName(name) {
    return this.rows.filter({ hasText: name });
  }

  async increment(index = 0) {
    await this.page.locator('[data-inc]').nth(index).click();
  }

  async decrement(index = 0) {
    await this.page.locator('[data-dec]').nth(index).click();
  }

  async remove(index = 0) {
    await this.page.locator('[data-del]').nth(index).click();
  }

  async close() {
    await this.page.locator('[data-close-cart]').first().click();
    await expect(this.root).toBeHidden();
  }

  async goToCheckout() {
    await this.checkoutButton.click();
    const checkout = new CheckoutModal(this.page);
    await expect(checkout.form).toBeVisible();
    return checkout;
  }
}
