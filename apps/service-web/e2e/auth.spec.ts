import { expect, test } from '@playwright/test';

test.describe('Service Web Authentication Flow', () => {
  test('should render login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible();
  });
});
