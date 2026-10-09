import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

test('onboarding synchronizes reception options and persists selection', async ({ page, playwright, baseURL }) => {
  test.skip(!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local database fixture cleanup.');

  const api = await playwright.request.newContext({ baseURL: `${process.env.ADMIN_API_URL ?? 'http://localhost:14000'}/api/v1/` });
  const login = await api.post('auth/login', { data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false } });
  expect(login.status()).toBe(200);
  const tokens = (await login.json()).data;
  const headers = { Authorization: `Bearer ${tokens.accessToken}` };
  const groups: string[] = [];
  const terms: string[] = [];
  const suffix = Date.now();
  try {
    for (const required of [true, false]) {
      const group = await api.post('operator-terms/groups', { headers, data: { title: `E2E onboarding ${required ? 'required' : 'reception'} ${suffix}`, isRequired: required, sortOrder: 99 } });
      expect(group.status()).toBe(201);
      const groupId = (await group.json()).data.id;
      groups.push(groupId);
      const term = await api.post('operator-terms', { headers, data: { termGroupId: groupId, version: '1.0', content: 'E2E consent', reason: 'E2E', summary: 'E2E', isNoticeRequired: false, ...(!required ? { metadata: { options: { email: false, sms: false } } } : {}) } });
      expect(term.status()).toBe(201);
      const termId = (await term.json()).data.id;
      terms.push(termId);
      expect((await api.post(`operator-terms/${termId}/publish`, { headers })).status()).toBe(200);
    }
    expect((await api.post('operator-terms/agreements', { headers, data: { agreements: [{ termId: terms[1], isAgreed: false, metadata: { options: { email: true, sms: false } } }] } })).status()).toBe(200);
    expect((await page.request.post('/api/v1/auth/login', { data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false } })).status()).toBe(200);
    await page.goto('/onboarding/agree-terms');
    await page.waitForLoadState('networkidle');
    const parent = page.getByRole('checkbox', { name: new RegExp(`E2E onboarding reception ${suffix}`) });
    const email = page.getByRole('checkbox', { name: '이메일 수신', exact: true });
    const sms = page.getByRole('checkbox', { name: '문자 수신', exact: true });
    await expect(email).toBeChecked();
    await expect(sms).not.toBeChecked();
    await expect(parent).toHaveAttribute('aria-checked', 'mixed');
    await email.uncheck();
    await expect(parent).not.toBeChecked();
    await parent.check();
    await expect(email).toBeChecked();
    await expect(sms).toBeChecked();
    await sms.uncheck();
    await expect(parent).toHaveAttribute('aria-checked', 'mixed');
    const all = page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' });
    await all.click();
    await expect(email).toBeChecked();
    await expect(sms).toBeChecked();
    await all.uncheck();
    await expect(email).not.toBeChecked();
    await expect(sms).not.toBeChecked();
    const submit = page.getByRole('button', { name: '동의하고 계속하기' });
    await expect(submit).toBeDisabled();
    await page.getByRole('checkbox', { name: new RegExp(`E2E onboarding required ${suffix}`) }).check();
    await email.check();
    const save = page.waitForResponse((r) => r.url().endsWith('/api/v1/operator-terms/agreements') && r.request().method() === 'POST');
    await submit.click();
    expect((await save).status()).toBe(200);
    const saved = await page.request.get('/api/v1/operator-terms/agreements');
    expect(saved.status()).toBe(200);
    const reception = (await saved.json()).data.items.find((item: { termId: string }) => item.termId === terms[1]);
    expect(reception.isAgreed).toBe(true);
    expect(reception.agreementMetadata.options).toEqual({ email: true, sms: false });
  }
  finally {
    for (const id of terms) {
      if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('Invalid fixture ID');
      execFileSync('docker', ['exec', '-i', 'service-factory-apps-postgres', 'psql', '-U', 'postgres', '-d', 'admin_db', '-v', 'ON_ERROR_STOP=1'], { input: `BEGIN; DELETE FROM user_term_agreement WHERE term='${id}'; DELETE FROM term WHERE id='${id}'; COMMIT;`, stdio: ['pipe', 'ignore', 'pipe'] });
    }
    for (const id of groups) expect((await api.delete(`operator-terms/groups/${id}`, { headers })).status()).toBe(200);
    await page.request.post('/api/v1/auth/logout', { data: {} });
    await api.post('auth/logout', { headers, data: { refreshToken: tokens.refreshToken } });
    await api.dispose();
  }
});
