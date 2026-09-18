import { expect, test } from '@playwright/test';

test.describe('Service Web Authentication Flow', () => {
  test('should login with super-admin credentials, view /api/v1/auth/me profile, and logout', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login');
    await expect(page.locator('text=관리자 로그인')).toBeVisible();

    // 2. Fill credentials
    await page.locator('input[type="email"]').fill('admin@test.com');
    await page.locator('input[type="password"]').fill('Test1234!');

    // 3. Submit login form and wait for response
    const loginResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/login') && res.status() === 200,
    );
    await page.locator('button[type="submit"]').click();
    await loginResponsePromise;

    // 4. Verify navigation to /app and profile data from /api/v1/auth/me
    await expect(page).toHaveURL(/.*\/app/, { timeout: 10000 });
    await expect(page.locator('text=Super Admin')).toBeVisible();
    await expect(page.locator('text=admin@test.com')).toBeVisible();
    await expect(page.locator('text=현재 세션 정보 (/api/v1/auth/me)')).toBeVisible();

    // 5. Verify refresh token cookie is set
    const cookies = await page.context().cookies();
    const refreshCookie = cookies.find((c) => c.name === 'refreshToken');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);

    // 6. Logout
    const logoutResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/logout') && res.status() === 200,
    );
    await page.getByRole('button', { name: '로그아웃' }).click();
    await logoutResponsePromise;

    // 7. Verify redirection back to /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

  test('should redirect unauthenticated user from /app to /login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});
