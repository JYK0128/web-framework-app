import { expect, test } from '@playwright/test';

test.describe('Admin management UI', () => {
  test('renders the admin grid, language switcher, and status filter', async ({ page }) => {
    const loginResponse = await page.request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(loginResponse.ok()).toBeTruthy();

    await page.goto('/admin-management');
    await expect(page.getByRole('heading', { name: '관리자 관리', level: 1 })).toBeVisible();
    await expect(page.getByText('관리자 목록', { exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /관리자/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /상태/ })).toBeVisible();

    const managementButton = page.getByRole('button', { name: '관리 작업' }).first();
    await expect(managementButton).toBeVisible();
    await managementButton.click();
    await expect(page.getByRole('menuitem', { name: '상세' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /2FA 초기화/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /승격|강등/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /정지/ })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /삭제|복구/ })).toBeVisible();
    await page.keyboard.press('Escape');

    const languageButton = page.locator('button[title="언어 설정"], button[title="Language settings"]');
    await expect(languageButton).toBeVisible();
    await languageButton.click();
    await expect(page.getByRole('menuitem', { name: 'English' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const statusFilter = page.getByRole('button', { name: /상태.*검색|search status column/i });
    await expect(statusFilter).toBeVisible();
    await statusFilter.click();
    await expect(page.getByRole('button', { name: '활성', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '정지', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '삭제', exact: true })).toBeVisible();
  });
});
