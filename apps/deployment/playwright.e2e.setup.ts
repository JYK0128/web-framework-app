import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { unlinkSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const deploymentDirectory = __dirname;
const environmentFile = `${deploymentDirectory}/.env.e2e`;
const composeArgs = ['compose', '--project-name', 'service-factory-apps-e2e', '--env-file', environmentFile, '-f', 'docker-compose.e2e.yml'];

function compose(...args: string[]): void {
  execFileSync('docker', [...composeArgs, ...args], { cwd: deploymentDirectory, stdio: 'inherit' });
}

async function waitForPage(url: string, label: string, attempts: number): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let consecutiveResponses = 0;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10_000 });
      if (response?.ok()) {
        consecutiveResponses += 1;
        if (consecutiveResponses === 3) {
          await browser.close();
          return;
        }
      }
      else consecutiveResponses = 0;
    }
    catch {
      // The service is still starting.
      consecutiveResponses = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  await browser.close();
  throw new Error(`Timed out waiting for ${label} at ${url}`);
}

export default async function globalSetup(): Promise<void> {
  try {
    writeFileSync(environmentFile, `E2E_POSTGRES_PASSWORD=${randomBytes(32).toString('base64url')}\n`, { mode: 0o600 });
    compose('down', '--volumes', '--remove-orphans');
    compose('up', '--detach', '--build', 'e2e-postgres', 'e2e-redis', 'e2e-loki', 'e2e-admin-api');
    compose('up', '--detach', 'e2e-service-api');
    compose('exec', '--no-TTY', 'e2e-admin-api', 'pnpm', 'db:seed');
    compose('exec', '--no-TTY', 'e2e-service-api', 'pnpm', 'db:seed');
    compose('up', '--detach', 'e2e-admin-web');
    await waitForPage('http://localhost:13100/login', 'admin web', 180);
    compose('up', '--detach', 'e2e-service-web');
    await waitForPage('http://localhost:3300/login', 'service web', 120);
  }
  catch (error) {
    try {
      compose('down', '--volumes', '--remove-orphans');
    }
    catch {
      // Preserve the startup failure; Docker may not have created the project.
    }
    try { unlinkSync(environmentFile); }
    catch { /* The temporary environment file may not exist. */ }
    throw error;
  }
}
