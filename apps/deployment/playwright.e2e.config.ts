import { defineConfig, devices } from '@playwright/test';

const adminWebURL = 'http://localhost:13100';
const serviceWebURL = 'http://localhost:3300';

process.env.ADMIN_WEB_URL = adminWebURL;
process.env.SERVICE_WEB_URL = serviceWebURL;
process.env.ADMIN_API_URL = 'http://localhost:14100';
process.env.SERVICE_API_URL = 'http://localhost:4100';
process.env.E2E_POSTGRES_CONTAINER = 'service-factory-apps-e2e-postgres';

function browserProject(name: string, testDir: string, baseURL: string, testMatch?: string, testIgnore?: string | string[]) {
  return {
    name,
    testDir,
    ...(testMatch ? { testMatch } : {}),
    ...(testIgnore ? { testIgnore } : {}),
    use: {
      ...devices['Desktop Chrome'],
      baseURL,
      extraHTTPHeaders: { Origin: new URL(baseURL).origin },
    },
  };
}

export default defineConfig({
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './playwright.e2e.setup.ts',
  globalTeardown: './playwright.e2e.teardown.ts',
  projects: [
    browserProject('admin', '../admin-web/e2e', adminWebURL, ['auth.spec.ts', 'faq-workflow.spec.ts']),
    browserProject('service-auth', '../service-web/e2e', serviceWebURL, 'auth.spec.ts'),
    {
      ...browserProject('service', '../service-web/e2e', serviceWebURL, ['faq-grid-width.spec.ts', 'faq-qna-auth.spec.ts', 'qna-workflow.spec.ts']),
      dependencies: ['service-auth'],
    },
  ],
});
