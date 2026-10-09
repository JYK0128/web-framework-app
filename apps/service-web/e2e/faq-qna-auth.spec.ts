import { expect, test } from '@playwright/test';

test('redirects an anonymous FAQ visitor to login before accessing Q&A', async ({ page }) => {
  const protectedRequests: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/qna' || path === '/api/v1/service-terms/agreements') protectedRequests.push(path);
  });
  await page.goto('/faq');
  await page.waitForLoadState('networkidle');
  await page.locator('nav a[href="/qna"]').click();
  await expect(page).toHaveURL(/\/login\?callback=%2Fqna/);
  expect(protectedRequests).toEqual([]);
});
