import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { ProductModal } from './ProductModal.js';
import { CartDrawer } from './CartDrawer.js';

/** Главная страница — витрина магазина. */
export class StorefrontPage extends BasePage {
  constructor(page) {
    super(page);
    this.cards = page.locator('.card');
    this.tabs = page.locator('.tab');
    this.cartButton = page.locator('#cartButton');
    this.cartCount = page.locator('#cartCount');
    this.heading = page.locator('h1');
  }

  async open() {
    await this.goto('/');
    await expect(this.cards.first()).toBeVisible();
    return this;
  }

  /** Чистая корзина перед тестом. */
  async resetCart() {
    await this.page.evaluate(function () { localStorage.clear(); });
    await this.page.reload();
    await expect(this.cards.first()).toBeVisible();
    return this;
  }

  tab(name) {
    return this.tabs.filter({ hasText: name });
  }

  card(name) {
    return this.cards.filter({
      has: this.page.getByRole('heading', { name: new RegExp('^' + escapeRegExp(name)) }),
    });
  }

  async openProduct(productName) {
    await this.card(productName).locator('[data-add]').click();
    return new ProductModal(this.page).waitForOpen();
  }

  async addToCart(productName, options = {}) {
    const modal = await this.openProduct(productName);
    if (options.quantity) await modal.setQuantity(options.quantity);
    for (const extra of options.extras || []) {
      await modal.toggleExtra(extra);
    }
    await modal.addToCart();
    return this;
  }

  async openCart() {
    await this.cartButton.click();
    return new CartDrawer(this.page).waitForOpen();
  }

  async cartCountValue() {
    return Number(await this.cartCount.textContent());
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
}
