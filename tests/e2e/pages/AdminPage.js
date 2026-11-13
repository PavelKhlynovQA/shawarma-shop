import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/** Админ-панель: вход, заказы, статусы, товары. */
export class AdminPage extends BasePage {
  constructor(page) {
    super(page);
    this.loginBox = page.locator('.login-box');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#loginButton');
    this.logoutButton = page.locator('#logoutButton');
    this.stats = page.locator('.stat');
    this.ordersTable = page.locator('table').first();
  }

  async open() {
    await this.goto('/admin');
    return this;
  }

  async openWithCleanSession() {
    await this.goto('/admin');
    await this.page.evaluate(function () { localStorage.clear(); });
    await this.page.reload();
    return this;
  }

  async login(email = 'admin@shawarma.ru', password = 'Admin123!') {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    return this;
  }

  async loginAsAdmin() {
    await this.login();
    await expect(this.stats.first()).toBeVisible();
    return this;
  }

  orderRow(publicId) {
    return this.page.locator('tr', { hasText: publicId });
  }

  async changeStatus(publicId, status) {
    await this.orderRow(publicId).locator('[data-status=' + status + ']').click();
  }

  productRow(name) {
    return this.page.locator('tr', { hasText: name });
  }

  async logout() {
    await this.logoutButton.click();
    await expect(this.loginBox).toBeVisible();
  }
}
