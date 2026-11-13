import { expect } from '@playwright/test';

/** Модальное окно товара: количество, дополнители, добавление в корзину. */
export class ProductModal {
  constructor(page) {
    this.page = page;
    this.root = page.locator('#productModal');
    this.body = page.locator('#productModalBody');
    this.title = this.body.locator('h2');
    this.addButton = page.locator('#modalAdd');
    this.total = page.locator('#modalTotal');
    this.quantity = page.locator('#modalQty');
  }

  async waitForOpen() {
    await expect(this.body).toBeVisible();
    return this;
  }

  async setQuantity(value) {
    for (let i = 1; i < value; i++) {
      await this.body.locator('[data-qty="1"]').click();
    }
    return this;
  }

  async toggleExtra(extraName) {
    await this.body.locator('.chip', { hasText: extraName }).click();
    return this;
  }

  async addToCart() {
    await this.addButton.click();
    await expect(this.root).toBeHidden();
  }
}
