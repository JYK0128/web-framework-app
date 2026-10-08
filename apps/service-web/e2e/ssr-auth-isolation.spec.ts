import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/auth';
import { expect, test } from '@playwright/test';

test('isolates authenticated and anonymous SSR requests without exposing access tokens', async ({ playwright, baseURL }) => {
  test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');
  const headers = { 'Origin': new URL(baseURL!).origin, 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36' };
  const authenticated = await playwright.request.newContext({ baseURL, extraHTTPHeaders: headers });
  const anonymous = await playwright.request.newContext({ baseURL, extraHTTPHeaders: headers });
  try {
    const login = await authenticated.post('/api/v1/auth/login', {
      data: { email: 'user@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(login.status()).toBe(200);
    const loginData = (await login.json()).data;
    expect(loginData.accessToken).toBeUndefined();
    expect(loginData.refreshToken).toBeUndefined();
    const cookies = (await authenticated.storageState()).cookies;
    expect(cookies.some((cookie) => cookie.name === 'service_session' && cookie.httpOnly)).toBe(true);
    expect(cookies.some((cookie) => cookie.name.endsWith('_refresh_token'))).toBe(false);
    const [signedIn, signedOut] = await Promise.all([
      authenticated.get('/qna'),
      anonymous.get('/qna'),
    ]);
    expect(signedIn.status()).toBe(200);
    expect(new URL(signedIn.url()).pathname).toBe('/qna');
    expect(new URL(signedOut.url()).pathname).toBe('/login');
    const html = await signedIn.text();
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
