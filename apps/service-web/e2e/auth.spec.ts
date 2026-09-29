import { expect, test } from '@playwright/test';

test.describe('Service Web Authentication Flow', () => {
  test('should login with super user credentials, view /api/v1/auth/me profile, and logout', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();

    // 2. Fill credentials
    await page.getByLabel('이메일').fill('user@test.com');
    await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');

    // 3. Submit login form and wait for response
    const loginResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/login') && res.status() === 200,
    );
    await page.getByRole('button', { name: '로그인' }).click();
    await loginResponsePromise;

    // 4. Verify navigation to Q&A and profile data from /api/v1/auth/me
    await expect(page).toHaveURL(/.*\/qna/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Q&A', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();

    // 5. Verify refresh token cookie is set
    const cookies = await page.context().cookies();
    const refreshCookie = cookies.find((c) => c.name === 'service_refresh_token');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);

    // 6. Logout
    const logoutResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/logout') && res.status() === 200,
    );
    await page.getByRole('button', { name: '로그아웃' }).click();
    await logoutResponsePromise;

    // 7. Verify redirection back to /login
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test('should redirect unauthenticated user from /qna to /login', async ({ page }) => {
    await page.goto('/qna');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});
