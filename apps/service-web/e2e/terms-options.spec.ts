import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/auth';
import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

function sql(query: string): string {
  return execFileSync('docker', ['exec', '-i', 'service-factory-apps-postgres', 'psql', '-U', 'postgres', '-d', 'service_db', '-At', '-v', 'ON_ERROR_STOP=1'], { input: query, encoding: 'utf8' }).trim();
}
function quote(value: string): string { return `'${value.replaceAll("'", "''")}'`; }

test('reception options persist independently and agreement history retains previous snapshots', async ({ page, request, playwright, baseURL }) => {
  test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');
  test.skip(!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local database fixture cleanup.');
  const login = await request.post('/api/v1/auth/login', { data: { email: 'user@test.com', password: '1q2w3e4r1@' } });
  expect(login.status()).toBe(200);
  const me = (await (await request.get('/api/v1/auth/me')).json()).data;
  const agreements = (await (await request.get('/api/v1/service-terms/agreements')).json()).data.items;
  const term = agreements.find((item: { isRequired: boolean }) => !item.isRequired);
  expect(term).toBeTruthy();
  const metadata = sql(`SELECT COALESCE(metadata::text, 'null') FROM term WHERE id=${quote(term.termId)};`);
  const ids = JSON.parse(sql(`SELECT COALESCE(json_agg(id), '[]') FROM user_term_agreement WHERE "user"=${quote(me.id)};`)) as string[];
  try {
    sql(`UPDATE term SET metadata='{"options":{"email":false,"sms":false,"messenger":false}}'::jsonb WHERE id=${quote(term.termId)};`);
    expect((await request.post('/api/v1/service-terms/agreements', { data: { agreements: agreements.map((item: { termId: string, isRequired: boolean }) => ({ termId: item.termId, isAgreed: item.isRequired })) } })).status()).toBe(200);
    await page.goto('/login?callback=%2Fprofile');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: '이메일' }).fill('user@test.com');
    await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await page.getByRole('tab', { name: /^약관/ }).click();
    const changed = page.waitForResponse((response) => response.url().endsWith('/api/v1/service-terms/agreements') && response.request().method() === 'POST');
    await page.getByRole('checkbox', { name: `${term.title} 이메일` }).click();
    expect((await changed).status()).toBe(200);
    const reread = (await (await request.get('/api/v1/service-terms/agreements')).json()).data.items.find((item: { termId: string }) => item.termId === term.termId);
    expect(reread.isAgreed).toBe(true);
    expect(reread.agreementMetadata.options).toEqual({ email: true, sms: false, messenger: false });
    await page.reload();
    await page.getByRole('tab', { name: /^약관/ }).click();
    await expect(page.getByRole('checkbox', { name: `${term.title} 이메일` })).toBeChecked();
    const withdrawn = await request.post('/api/v1/service-terms/agreements', { data: { agreements: [{ termId: term.termId, isAgreed: false }] } });
    expect(withdrawn.status()).toBe(200);
    const history = await request.get(`/api/v1/service-terms/agreement-history?groupId=${term.groupId}&limit=1`);
    expect(history.status()).toBe(200);
    const first = (await history.json()).data;
    expect(first.items[0].isAgreed).toBe(false);
    expect(first.items[0].metadata.options.email).toBe(false);
    expect(first.hasNextPage).toBe(true);
    const next = await request.get(`/api/v1/service-terms/agreement-history?groupId=${term.groupId}&limit=1&cursor=${encodeURIComponent(first.endCursor)}`);
    expect(next.status()).toBe(200);
    const previous = (await next.json()).data.items[0];
    expect(previous.isAgreed).toBe(true);
    expect(previous.metadata.options.email).toBe(true);
    await page.getByRole('button', { name: '동의 이력', exact: true }).last().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '내용 보기' }).first().click();
    await expect(dialog.getByText('이메일: 수신 안 함', { exact: true })).toBeVisible();
    expect((await request.post('/api/v1/service-terms/agreements', { data: { agreements: [{ termId: term.termId, isAgreed: true, metadata: { options: { unknown: true } } }] } })).status()).toBe(400);
    expect((await request.post('/api/v1/service-terms/agreements', { data: { agreements: [{ termId: term.termId, isAgreed: true, metadata: { options: { email: 'yes' } } }] } })).status()).toBe(400);
    const anonymous = await playwright.request.newContext({ baseURL });
    try {
      expect((await anonymous.get(`/api/v1/service-terms/agreement-history?groupId=${term.groupId}`)).status()).toBe(401);
    }
    finally { await anonymous.dispose(); }
  }
  finally {
    sql(`DELETE FROM user_term_agreement WHERE "user"=${quote(me.id)} ${ids.length ? `AND id NOT IN (${ids.map(quote).join(',')})` : ''}; UPDATE term SET metadata=${metadata === 'null' ? 'NULL' : `${quote(metadata)}::jsonb`} WHERE id=${quote(term.termId)};`);
    await page.request.post('/api/v1/auth/logout', { data: {} });
    await request.post('/api/v1/auth/logout', { data: {} });
  }
});

test('admin-defined reception channels round-trip through the internal service API', async ({ request, baseURL }) => {
  test.skip(!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local paired APIs.');
  const admin = 'http://localhost:14000/api/v1';
  const login = await request.post(`${admin}/auth/login`, { data: { email: 'admin@test.com', password: '1q2w3e4r1@' } });
  expect(login.status()).toBe(200);
  const headers = { Authorization: `Bearer ${(await login.json()).data.accessToken}` };
  let groupId: string | undefined;
  let termId: string | undefined;
  try {
    const group = await request.post(`${admin}/service-terms/groups`, { headers, data: { title: `E2E reception ${Date.now()}`, isRequired: false, sortOrder: 99 } });
    expect(group.status()).toBe(201);
    groupId = (await group.json()).data.id;
    const data = { groupId, version: '1.0', content: 'E2E reception consent', reason: 'E2E', summary: 'E2E', isNoticeRequired: false, metadata: { options: { email: false, sms: false } } };
    const created = await request.post(`${admin}/service-terms`, { headers, data });
    expect(created.status()).toBe(201);
    termId = (await created.json()).data.id;
    expect((await created.json()).data.metadata.options).toEqual({ email: false, sms: false });
    const changed = await request.patch(`${admin}/service-terms/${termId}`, { headers, data: { ...data, metadata: { options: { messenger: false } } } });
    expect(changed.status()).toBe(200);
    const reread = await request.get(`${admin}/service-terms?groupId=${groupId}`, { headers });
    expect(reread.status()).toBe(200);
    expect((await reread.json()).data.items[0].metadata.options).toEqual({ messenger: false });
  }
  finally {
    if (termId) expect((await request.delete(`${admin}/service-terms/${termId}`, { headers })).status()).toBe(200);
    if (groupId) expect((await request.delete(`${admin}/service-terms/groups/${groupId}`, { headers })).status()).toBe(200);
    await request.post(`${admin}/auth/logout`, { data: {} });
  }
});
