import { defineConfig, devices } from '@playwright/test';

const storybookURL = 'http://127.0.0.1:6007';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'feature-survey-flow.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: storybookURL,
  },
  webServer: {
    command: 'pnpm --filter @pkg/web-core exec storybook dev -p 6007 --host 127.0.0.1',
    url: `${storybookURL}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
