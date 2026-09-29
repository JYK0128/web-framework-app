import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-integration',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.ADMIN_WEB_URL ?? 'http://localhost:13000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
