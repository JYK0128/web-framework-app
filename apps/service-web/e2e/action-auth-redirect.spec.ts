import { expect, test } from '@playwright/test';

test('anonymous visitor is redirected from Q&A to sign in', async ({ page }) => {
  await page.goto('/qna');
  await expect(page).toHaveURL(/\/login/);
});
