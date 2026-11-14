import { expect } from '@playwright/test';

/** Вход по номеру телефона с кодом из SMS (в демо-режиме код показан на экране). */
export class AuthModal {
  constructor(page) {
    this.page = page;
    this.root = page.locator('#authModal');
    this.body = page.locator('#authBody');
    this.phoneInput = this.body.locator('[name=phone]');
    this.codeInput = this.body.locator('[name=code]');
    this.sendCodeButton = page.locator('#sendCodeBtn');
    this.verifyButton = page.locator('#verifyCodeBtn');
    this.demoCode = page.locator('#demoCode');
    this.userChip = page.locator('.auth-chip');
  }

  async open() {
    await this.page.locator('#loginBtn').click();
    await expect(this.body).toBeVisible();
    return this;
  }

  async requestCode(phone) {
    await this.phoneInput.fill(phone);
    await this.sendCodeButton.click();
    await expect(this.codeInput).toBeVisible();
    return this;
  }

  async readDemoCode() {
    await expect(this.demoCode).toBeVisible();
    return (await this.demoCode.textContent()).trim();
  }

  async verify(code) {
    await this.codeInput.fill(code);
    await this.verifyButton.click();
    return this;
  }

  /** Полный вход: телефон → код → подтверждение. */
  async loginByPhone(phone) {
    await this.open();
    await this.requestCode(phone);
    const code = await this.readDemoCode();
    await this.verify(code);
    await expect(this.userChip).toBeVisible();
    return code;
  }
}
