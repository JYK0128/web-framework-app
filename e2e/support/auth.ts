import { expect, type Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForResponse((response) => response.url().includes('/api/v1/auth/providers'));
  await page.locator('input[type="email"]:visible').fill('admin@test.com');
  await page.locator('input[type="password"]:visible').fill('1q2w3e4r1@');
  const submit = page.locator('button[type="submit"]:visible');
  await expect(submit).toBeEnabled();
  await submit.click({ force: true });
  await expect(page).toHaveURL(/dashboard/);
}
