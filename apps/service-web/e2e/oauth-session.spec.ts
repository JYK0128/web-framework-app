import { expect, test } from '@playwright/test';

const apiURL = process.env.SERVICE_E2E_API_URL ?? 'http://localhost:14104';

async function loginWithOAuth(page: import('@playwright/test').Page, callback: string) {
  await page.goto(`/login?callback=${encodeURIComponent(callback)}`);
  await page.getByRole('link', { name: 'E2E OAuth' }).click();
  await expect(page).toHaveURL(new RegExp(`${callback.replaceAll('/', '\\/')}/?$`));

  const cookies = await page.context().cookies();
  const session = cookies.find((cookie) => cookie.name === 'service_session');
  expect(session?.httpOnly).toBe(true);
  expect(session?.value).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ/);
  expect(cookies.some((cookie) => cookie.name.endsWith('_refresh_token'))).toBe(false);
  return session!;
}

test('OAuth session survives reload, FAQ navigation, and favicon requests, then logout revokes it', async ({ page }) => {
  const session = await loginWithOAuth(page, '/qna');

  const me = await page.request.get('/api/v1/auth/me');
  expect(me.status()).toBe(200);
  expect((await me.json()).data.email).toBe('oauth-e2e@example.test');

  const refresh = await page.request.post('/api/v1/auth/refresh', { data: {} });
  expect(refresh.status()).toBe(200);
  expect((await refresh.json()).data).toEqual({});
  const refreshedSession = (await page.context().cookies()).find((cookie) => cookie.name === 'service_session');
  expect(refreshedSession?.value).not.toBe(session.value);

  const qna = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/qna' && response.status() === 200);
  await page.reload();
  expect((await qna).status()).toBe(200);
  await expect(page).toHaveURL(/\/qna\/?$/);

  await page.goto('/faq');
  await expect(page).toHaveURL(/\/faq\/?$/);
  const favicon = await page.request.get('/favicon.ico?oauth-session-check=1');
  expect(favicon.status()).toBe(200);
  const retained = (await page.context().cookies()).find((cookie) => cookie.name === 'service_session');
  expect(retained?.value).toBe(refreshedSession?.value);

  const nextQna = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/qna' && response.status() === 200);
  await page.goto('/qna');
  expect((await nextQna).status()).toBe(200);
  expect((await page.request.post('/api/v1/auth/logout', { data: {} })).status()).toBe(200);
  expect((await page.request.get('/api/v1/auth/me')).status()).toBe(401);
  expect((await page.context().cookies()).some((cookie) => cookie.name === 'service_session')).toBe(false);
});

test('a revoked OAuth session cannot refresh and sends the browser back to login', async ({ page, request }) => {
  await loginWithOAuth(page, '/qna');
  const revoked = await request.post(`${apiURL}/__e2e/revoke-sessions`);
  expect(revoked.status()).toBe(200);

  await page.reload();
  await expect(page).toHaveURL(/\/login\?callback=%2Fqna/);
  expect((await page.context().cookies()).some((cookie) => cookie.name === 'service_session')).toBe(false);
});
