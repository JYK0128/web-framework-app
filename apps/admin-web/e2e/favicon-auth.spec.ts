import { expect, test } from '@playwright/test';

test('keeps admin API access when favicon loads alongside repeated page reloads', async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('이메일').fill('admin@test.com');
    await page.locator('input[type="password"]').fill('1q2w3e4r1@');
    const login = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/auth/login');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    expect((await login).status()).toBe(200);
    await expect(page).toHaveURL(/\/profile\/?$/);
    await page.waitForLoadState('networkidle');
    const originalSession = (await page.context().cookies()).find((cookie) => cookie.name === 'admin_session');
    expect(originalSession?.httpOnly).toBe(true);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const qna = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/qna' && response.status() === 200);
      const [document, favicon] = await Promise.all([
        page.goto('/qna'),
        page.request.get(`/favicon.ico?auth-regression=${attempt}`),
      ]);
      expect(favicon.status()).toBe(200);
      expect(favicon.headers()['content-type']).toContain('image/');
      expect(document?.status()).toBe(200);
      expect((await qna).status()).toBe(200);
      await expect(page).toHaveURL(/\/qna\/?$/);
      const session = (await page.context().cookies()).find((cookie) => cookie.name === 'admin_session');
      expect(session?.httpOnly).toBe(true);
      expect(session?.value).toBe(originalSession?.value);
      await page.waitForLoadState('networkidle');
    }
  }
  finally {
    const logout = await page.request.post('/api/v1/auth/logout', { data: {} });
    expect(logout.status()).toBe(200);
  }
});
