import { expect, test } from '@playwright/test';

test('keeps authenticated Q&A access after repeated FAQ reloads and navigation', async ({ page }) => {
  test.setTimeout(60_000);
  try {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill('user@test.com');
    await page.locator('input[type="password"]').fill('1q2w3e4r1@');
    const loginResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/auth/login');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    expect((await loginResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);

    await page.locator('nav a[href="/faq"]').click();
    await expect(page).toHaveURL(/\/faq$/);
    await page.waitForLoadState('networkidle');
    const oldCookie = (await page.context().cookies()).find((cookie) => cookie.name === 'service_refresh_token');
    expect(oldCookie).toBeDefined();

    const documentResponse = await page.reload();
    expect((await documentResponse!.allHeaders())['set-cookie']).toBeDefined();
    const newCookie = (await page.context().cookies()).find((cookie) => cookie.name === 'service_refresh_token');
    expect(newCookie?.value).not.toBe(oldCookie?.value);
    await page.waitForLoadState('networkidle');

    const qnaResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/qna' && response.request().method() === 'GET');
    await page.locator('nav a[href="/qna"]').click();
    expect((await qnaResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/qna\/?$/);
    await expect(page.getByText('Authentication is required.', { exact: true })).toHaveCount(0);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/qna\/?$/);
    const searchedQna = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/api/v1/qna' && url.searchParams.get('search') === 'auth-restoration-check';
    });
    const search = page.getByPlaceholder('제목 또는 내용 검색');
    await search.fill('auth-restoration-check');
    await search.press('Enter');
    expect((await searchedQna).status()).toBe(200);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await page.locator('nav a[href="/faq"]').click();
      await expect(page).toHaveURL(/\/faq$/);
      // Chrome requests favicon alongside navigation; it must never rotate the session.
      const [document, favicon] = await Promise.all([
        page.reload(),
        page.request.get(`/favicon.ico?auth-regression=${attempt}`),
      ]);
      expect(favicon.status()).toBe(200);
      expect(favicon.headers()['content-type']).toContain('image/');
      expect((await document!.allHeaders())['set-cookie']).toBeDefined();
      await page.waitForLoadState('networkidle');
      const nextQna = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/qna');
      await page.locator('nav a[href="/qna"]').hover();
      await page.locator('nav a[href="/qna"]').click();
      expect((await nextQna).status()).toBe(200);
      await expect(page).toHaveURL(/\/qna\/?$/);
    }
  }
  finally {
    const logout = await page.request.post('/api/v1/auth/logout', { data: {} });
    expect(logout.status()).toBe(200);
  }
});

test('redirects an anonymous FAQ visitor to login before accessing Q&A', async ({ page }) => {
  const protectedRequests: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/qna' || path === '/api/v1/service-terms/agreements') protectedRequests.push(path);
  });
  await page.goto('/faq');
  await page.waitForLoadState('networkidle');
  await page.locator('nav a[href="/qna"]').click();
  await expect(page).toHaveURL(/\/login\?callback=%2Fqna/);
  expect(protectedRequests).toEqual([]);
});

test('redirects to login when agreements and refresh reject an expired session', async ({ page }) => {
  const rejectedPaths: string[] = [];
  try {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill('user@test.com');
    await page.locator('input[type="password"]').fill('1q2w3e4r1@');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.locator('nav a[href="/faq"]').click();
    await expect(page).toHaveURL(/\/faq$/);
    await page.waitForLoadState('networkidle');

    // Revoke the real session without clearing the page's cached user or in-memory token.
    const revoke = await page.request.post('/api/v1/auth/logout', { data: {} });
    expect(revoke.status()).toBe(200);
    page.on('response', (response) => {
      if (response.status() === 401) rejectedPaths.push(new URL(response.url()).pathname);
    });
    await page.locator('nav a[href="/qna"]').click();
    await expect(page).toHaveURL(/\/login\?callback=%2Fqna/);
    expect(rejectedPaths).toContain('/api/v1/service-terms/agreements');
    expect(rejectedPaths).toContain('/api/v1/auth/refresh');
    await expect(page.getByText('페이지를 불러오지 못했습니다', { exact: true })).toHaveCount(0);

    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill('user@test.com');
    await page.locator('input[type="password"]').fill('1q2w3e4r1@');
    const qna = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/qna');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    expect((await qna).status()).toBe(200);
    await expect(page).toHaveURL(/\/qna\/?$/);
  }
  finally {
    const logout = await page.request.post('/api/v1/auth/logout', { data: {} });
    expect(logout.status()).toBe(200);
  }
});
