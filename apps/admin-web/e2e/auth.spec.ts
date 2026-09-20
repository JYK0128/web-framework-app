import { expect, test } from '@playwright/test';

test.describe('Admin Authentication API Flow', () => {
  test('should expose the login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: '로그인', exact: true })).toBeVisible();
  });

  test('should login, read me, rotate refresh token, reject reuse, and logout', async ({ request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(loginResponse.status()).toBe(200);

    const loginBody = await loginResponse.json() as { data: { accessToken: string, refreshToken?: string } };
    const accessToken = loginBody.data.accessToken;
    const refreshToken = loginBody.data.refreshToken
      ?? (await request.storageState()).cookies.find((cookie) => cookie.name === 'admin_refresh_token')?.value;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    const meResponse = await request.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meResponse.status()).toBe(200);
    expect((await meResponse.json()).data.email).toBe('admin@test.com');

    const refreshResponse = await request.post('/api/v1/auth/refresh', { data: {} });
    expect(refreshResponse.status()).toBe(200);
    const refreshBody = await refreshResponse.json() as { data: { accessToken: string, refreshToken?: string } };
    expect(refreshBody.data.accessToken).toBeTruthy();

    const reuseResponse = await request.post('/api/v1/auth/refresh', { data: { refreshToken } });
    expect(reuseResponse.status()).toBe(401);

    const logoutResponse = await request.post('/api/v1/auth/logout', { data: {} });
    expect(logoutResponse.status()).toBe(200);
  });

  test('should reject an unauthenticated protected request', async ({ request }) => {
    const response = await request.get('/api/v1/auth/me');
    expect(response.status()).toBe(401);
  });

});
