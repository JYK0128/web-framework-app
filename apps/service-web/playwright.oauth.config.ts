import { defineConfig, devices } from '@playwright/test';

const webURL = 'http://localhost:13104';
const apiURL = 'http://localhost:14104';
process.env.SERVICE_E2E_API_URL = apiURL;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'oauth-session.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: webURL,
    extraHTTPHeaders: { Origin: new URL(webURL).origin },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'node e2e/oauth-test-api.mjs',
      url: `${apiURL}/__e2e/health`,
      reuseExistingServer: false,
      env: { SERVICE_E2E_API_PORT: '14104', SERVICE_E2E_WEB_URL: webURL },
    },
    {
      command: 'pnpm dev',
      url: webURL,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'development',
        PORT: '13104',
        APP_BASE_URL: webURL,
        API_BASE_URL: apiURL,
      },
    },
  ],
});
