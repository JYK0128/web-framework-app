import { expect, test } from '@playwright/test';

test('renders the public home with a fresh CSP nonce for each request', async ({ request }) => {
  const responses = await Promise.all([
    request.get('/en', { headers: { 'accept-language': 'en' } }),
    request.get('/en', { headers: { 'accept-language': 'en' } }),
  ]);
  const nonces: string[] = [];
  for (const response of responses) {
    expect(response.status()).toBe(200);
    const html = await response.text();
    const nonce = /nonce=["']([^"']+)["']/.exec(html)?.[1];
    expect(nonce).toBeTruthy();
    expect(response.headers()['content-security-policy']).toContain(`'nonce-${nonce}'`);
    expect(response.headers()['content-language']).toBe('en');
    expect(response.headers()['set-cookie']).toBeUndefined();
    nonces.push(nonce!);
  }
  expect(nonces[0]).not.toBe(nonces[1]);
});

test('renders login on the server, hydrates, and navigates to the server-rendered profile without a document reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy|hydration|Minified React/i.test(message.text())) errors.push(message.text());
  });
  try {
    const document = await page.goto('/login');
    expect(document?.status()).toBe(200);
    const html = await document!.text();
    expect(html).toContain('<form');
    expect(html).toContain('type="password"');
    const nonce = /nonce=["']([^"']+)["']/.exec(html)?.[1];
    expect(nonce).toBeTruthy();
    expect(document!.headers()['content-security-policy']).toContain(`'nonce-${nonce}'`);
    await page.waitForLoadState('networkidle');
    let documentRequests = 0;
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests += 1;
    });
    await page.locator('input[type="email"]').fill('user@test.com');
    await page.locator('input[type="password"]').fill('1q2w3e4r1@');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);
    expect(documentRequests).toBe(0);
    await page.waitForLoadState('networkidle');
    const profile = await page.goto('/profile');
    expect(profile).not.toBeNull();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('계정의 보안 상태를 확인하고 관리합니다.', { exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(new URL(profile!.url()).pathname).toBe('/profile');
    expect(profile!.status()).toBe(200);
    expect(await profile!.text()).toContain('계정의 보안 상태를 확인하고 관리합니다.');
    expect((await profile!.allHeaders())['set-cookie']).toBeDefined();
    // The profile body is included in the authenticated SSR response.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('계정의 보안 상태를 확인하고 관리합니다.', { exact: true })).toBeVisible();
    documentRequests = 0;
    const qna = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/qna' && response.status() === 200);
    await page.locator('nav a[href="/qna"]').click();
    await qna;
    await expect(page).toHaveURL(/\/qna\/?$/);
    expect(documentRequests).toBe(0);
    expect(errors).toEqual([]);
  }
  finally {
    const logout = await page.request.post('/api/v1/auth/logout', { data: {} });
    expect(logout.status()).toBe(200);
  }
});
