import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { expect, test } from '@playwright/test';

test.describe('Service Web Authentication Flow', () => {
  test('should login with super user credentials, view /api/v1/auth/me profile, and logout', async ({ page }) => {
    test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');
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
    const login = await loginResponsePromise;
    expect((await login.json()).data.accessToken).toBeUndefined();

    // 4. Verify navigation to Q&A and profile data from /api/v1/auth/me
    await expect(page).toHaveURL(/.*\/qna/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Q&A', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /log out|로그아웃/i })).toBeVisible();

    // 5. Verify only the server session cookie is set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'service_session');
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(cookies.some((cookie) => cookie.name === 'service_refresh_token')).toBe(false);
    expect((await page.request.get('/api/v1/auth/me')).status()).toBe(200);
    await page.reload();
    await expect(page).toHaveURL(/\/qna/);

    // 6. Logout
    const logoutResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/logout') && res.status() === 200,
    );
    await page.getByRole('button', { name: /log out|로그아웃/i }).click();
    await logoutResponsePromise;

    // 7. Verify redirection back to /login
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    expect((await page.request.get('/api/v1/auth/me')).status()).toBe(401);
  });

  test('should redirect unauthenticated user from /qna to /login', async ({ page }) => {
    await page.goto('/qna');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});

test('disabled service credential login does not establish a server session', async ({ request }) => {
  test.skip(SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'This check requires the disabled credential policy.');
  const response = await request.post('/api/v1/auth/login', {
    data: { email: 'user@test.com', password: '1q2w3e4r1@', rememberMe: false },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).errorCode).toBe('CREDENTIAL_AUTH_UNAVAILABLE');
  expect((await request.storageState()).cookies.some((cookie) => cookie.name === 'service_session')).toBe(false);
  expect((await request.get('/api/v1/auth/me')).status()).toBe(401);
});
