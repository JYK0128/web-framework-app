import { expect, test } from '@playwright/test';

test('blocks customer pages during maintenance and returns after maintenance ends', async ({ page }) => {
  let active = true;
  let statusChecks = 0;

  await page.route('**/api/v1/system-configs/maintenance', async (route) => {
    statusChecks += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        success: true,
        statusCode: 200,
        path: '/api/v1/system-configs/maintenance',
        requestId: 'e2e-maintenance',
        timestamp: new Date().toISOString(),
        data: {
          active,
          message: active ? 'E2E 예정 점검 안내' : '',
        },
      },
    });
  });

  await page.goto('/faq');
  await expect(page.getByText('서비스 점검 중입니다', { exact: true })).toBeVisible();
  await expect(page.getByText('E2E 예정 점검 안내')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'FAQ', level: 1 })).toHaveCount(0);
  expect(statusChecks).toBe(1);

  active = false;
  await page.getByRole('button', { name: '상태 다시 확인' }).click();

  await expect(page.getByRole('heading', { name: 'FAQ', level: 1 })).toBeVisible();
  expect(statusChecks).toBe(2);
});
