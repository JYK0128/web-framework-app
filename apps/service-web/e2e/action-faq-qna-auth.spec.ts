import { expect, test } from '@playwright/test';

test('redirects an anonymous FAQ visitor to login before accessing Q&A', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await page.getByRole('link', { name: 'Q&A', exact: true }).first().click();
  await expect(page).toHaveURL(/\/login\?callback=%2Fqna/);
});
