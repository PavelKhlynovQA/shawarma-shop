import { defineConfig, devices } from '@playwright/test';

/**
 * Визуальные тесты — отдельный конфиг, потому что эталонные скриншоты
 * привязаны к платформе (win32 / linux) и шрифтам.
 *
 * Базлайны генерируются командой: npm run test:visual:update
 */
export default defineConfig({
  testDir: './tests/visual',
  timeout: 40_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-visual', open: 'never' }]],

  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'visual-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
    },
  ],

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'node src/server.js',
        url: 'http://127.0.0.1:3000/api/health',
        reuseExistingServer: true,
        timeout: 60_000,
        env: { PORT: '3000', SQLITE_FILE: './data/e2e.db', NODE_ENV: 'test' },
      },
});
