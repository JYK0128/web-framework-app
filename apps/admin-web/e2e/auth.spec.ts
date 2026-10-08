import { expect, test } from '@playwright/test';

test('browser login authenticates through a server session, survives reload and logout invalidates that session', async ({ page, playwright, baseURL }) => {
  try {
    await page.goto('/login?callback=%2Fcustomers');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('이메일').fill('admin@test.com');
    await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
    const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login') && response.request().method() === 'POST');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    const login = await loginResponse;
    expect(login.status()).toBe(200);
    const loginData = (await login.json()).data;
    expect(loginData.accessToken).toBeUndefined();
    expect(loginData.refreshToken).toBeUndefined();
    await expect(page).toHaveURL(/\/customers$/);

    const cookies = await page.context().cookies();
    const session = cookies.find((cookie) => cookie.name === 'admin_session');
    expect(session?.httpOnly).toBe(true);
    expect(session!.value).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ/);
    expect(cookies.some((cookie) => cookie.name === 'admin_refresh_token')).toBe(false);
    const me = await page.request.get('/api/v1/auth/me');
    expect(me.status()).toBe(200);
    expect((await me.json()).data.email).toBe('admin@test.com');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/customers$/);
    const refresh = await page.request.post('/api/v1/auth/refresh', { data: {} });
    expect(refresh.status()).toBe(200);
    expect((await refresh.json()).data).toEqual({});

    const logoutResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/logout'));
    await page.getByRole('button', { name: '프로필 메뉴' }).click();
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    expect((await logoutResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/login/);
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

test('rejects anonymous access and cross-origin login', async ({ request }) => {
  expect((await request.get('/api/v1/auth/me')).status()).toBe(401);
  const login = await request.post('/api/v1/auth/login', {
    headers: { Origin: 'https://attacker.example' },
    data: { email: 'admin@test.com', password: '1q2w3e4r1@' },
  });
  expect(login.status()).toBe(403);
});

test('a revoked server session redirects a protected browser after its next data request', async ({ page, playwright, baseURL }) => {
  const login = await page.request.post('/api/v1/auth/login', {
    data: { email: 'admin@test.com', password: '1q2w3e4r1@' },
  });
  expect(login.status()).toBe(200);
  const session = (await page.context().cookies()).find((cookie) => cookie.name === 'admin_session');
  expect(session).toBeDefined();
  const other = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: new URL(baseURL!).origin, Cookie: `${session!.name}=${session!.value}` } });
  try {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    expect((await other.post('/api/v1/auth/logout', { data: {} })).status()).toBe(200);
    const denied = page.waitForResponse((response) => response.url().includes('/api/v1/customers') && response.status() === 401);
    await page.getByPlaceholder('이름 또는 이메일 검색...').fill('session-expired');
    await denied;
    await expect(page).toHaveURL(/\/login/);
    expect((await page.request.get('/api/v1/auth/me')).status()).toBe(401);
  }
  finally {
    expect((await page.request.post('/api/v1/auth/logout', { data: {} })).status()).toBe(200);
    await other.dispose();
  }
});


test('encrypted cookie rejects tampering and parallel refresh requests share one rotation', async ({ playwright, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const authenticated = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: origin } });
  const contexts = [];
  try {
    const login = await authenticated.post('/api/v1/auth/login', { data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false } });
    expect(login.status()).toBe(200);
    const state = await authenticated.storageState();
    const session = state.cookies.find((cookie) => cookie.name === 'admin_session')!;
    const tampered = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Cookie: `${session.name}=${session.value.slice(0, -8)}tampered` } });
    try { expect((await tampered.get('/api/v1/auth/me')).status()).toBe(401); }
    finally { await tampered.dispose(); }
    for (let i = 0; i < 3; i++) contexts.push(await playwright.request.newContext({ baseURL, storageState: state, extraHTTPHeaders: { Origin: origin } }));
    const refreshed = await Promise.all(contexts.map((context) => context.post('/api/v1/auth/refresh', { data: {} })));
    expect(refreshed.map((response) => response.status())).toEqual([200, 200, 200]);
    for (const context of contexts) expect((await context.get('/api/v1/auth/me')).status()).toBe(200);
  }
  finally {
    const cleanup = contexts.length ? contexts[0] : authenticated;
    expect((await cleanup.post('/api/v1/auth/logout', { data: {} })).status()).toBe(200);
    await Promise.all(contexts.map((context) => context.dispose()));
    await authenticated.dispose();
  }
});
