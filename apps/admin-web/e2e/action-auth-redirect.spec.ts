import { expect, test } from '@playwright/test';

test('anonymous visitor is redirected from a protected page to sign in', async ({ page }) => {
  await page.goto('/customers');
  await expect(page).toHaveURL(/\/login/);
});
