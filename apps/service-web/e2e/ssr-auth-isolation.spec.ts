import { expect, test } from '@playwright/test';

test('isolates authenticated and anonymous SSR requests without exposing access tokens', async ({ playwright, baseURL }) => {
  const headers = { 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36' };
  const authenticated = await playwright.request.newContext({ baseURL, extraHTTPHeaders: headers });
  const anonymous = await playwright.request.newContext({ baseURL, extraHTTPHeaders: headers });
  try {
    const login = await authenticated.post('/api/v1/auth/login', {
      data: { email: 'user@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(login.status()).toBe(200);
    const accessToken = (await login.json()).data.accessToken;
    expect(accessToken).toBeTruthy();
    const [signedIn, signedOut] = await Promise.all([
      authenticated.get('/qna'),
      anonymous.get('/qna'),
    ]);
    expect(signedIn.status()).toBe(200);
    expect(new URL(signedIn.url()).pathname).toBe('/qna');
    expect(signedIn.headers()['set-cookie']).toBeDefined();
    expect(new URL(signedOut.url()).pathname).toBe('/login');
    const html = await signedIn.text();
    expect(html).not.toContain(accessToken);
    expect(html).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  }
  finally {
    try {
      const logout = await authenticated.post('/api/v1/auth/logout', { data: {} });
      expect(logout.status()).toBe(200);
    }
    finally {
      await authenticated.dispose();
      await anonymous.dispose();
    }
  }
});
