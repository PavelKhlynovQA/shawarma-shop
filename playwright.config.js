import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация E2E-тестов.
 * По умолчанию поднимает приложение на SQLite (data/e2e.db),
 * но если сервер уже запущен — переиспользует его.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 40_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'node src/server.js',
        url: 'http://127.0.0.1:3000/api/health',
        reuseExistingServer: true,
        timeout: 60_000,
        env: {
          PORT: '3000',
          SQLITE_FILE: './data/e2e.db',
          NODE_ENV: 'test',
          SEED_ON_START: 'true',
        },
      },
});
