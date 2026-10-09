import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { expect, test } from '@playwright/test';

test.describe('Service Web Authentication Flow', () => {
  test('browser login authenticates through a server session, survives reload and logout invalidates that session', async ({ page, playwright, baseURL }) => {
    test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');
    try {
      await page.goto('/login?callback=%2Fqna');
      await page.waitForLoadState('networkidle');
      await page.getByLabel('이메일').fill('user@test.com');
      await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
      const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login') && response.request().method() === 'POST');
      await page.getByRole('button', { name: '로그인', exact: true }).click();
      const login = await loginResponse;
      expect(login.status()).toBe(200);
      const loginData = (await login.json()).data;
      expect(loginData.accessToken).toBeUndefined();
      expect(loginData.refreshToken).toBeUndefined();
      await expect(page).toHaveURL(/\/qna$/);

      const cookies = await page.context().cookies();
      const session = cookies.find((cookie) => cookie.name === 'service_session');
      expect(session?.httpOnly).toBe(true);
      expect(session!.value).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ/);
      expect(cookies.some((cookie) => cookie.name === 'service_refresh_token')).toBe(false);
      const me = await page.request.get('/api/v1/auth/me');
      expect(me.status()).toBe(200);
      expect((await me.json()).data.email).toBe('user@test.com');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/qna$/);
      const refresh = await page.request.post('/api/v1/auth/refresh', { data: {} });
      expect(refresh.status()).toBe(200);
      expect((await refresh.json()).data).toEqual({});

      const logoutResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/logout'));
      await page.getByRole('button', { name: '프로필 메뉴' }).click();
      await page.getByRole('button', { name: '로그아웃', exact: true }).click();
      expect((await logoutResponse).status()).toBe(200);
      await expect(page).toHaveURL(/\/$/);
      expect((await page.request.get('/api/v1/auth/me')).status()).toBe(401);
      const replay = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Cookie: `${session!.name}=${session!.value}` } });
      try {
        expect((await replay.get('/api/v1/auth/me')).status()).toBe(401);
      }
      finally { await replay.dispose(); }
    }
    finally {
      expect((await page.request.post('/api/v1/auth/logout', { data: {} })).status()).toBe(200);
    }
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
