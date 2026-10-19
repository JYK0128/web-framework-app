import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

// This suite changes global settings and must run against disposable test databases.
const proxy = process.env.E2E_CONFIG_FAULT_PROXY;
const postgres = process.env.E2E_CONFIG_POSTGRES_CONTAINER;
test.skip(!proxy || !postgres?.startsWith('codex-config-e2e-pg-'), 'Requires an isolated config E2E stack and fault proxy.');
test.use({ actionTimeout: 15_000 });
const origin = process.env.ADMIN_WEB_URL!;
const headers = { Origin: origin };
function readDatabase(database: 'admin_e2e' | 'service_e2e', code: 'email' | 'webhook' | 'oauth' | 'inquiry') {
  const text = execFileSync('docker', ['exec', postgres!, 'psql', '-U', 'e2e', '-d', database, '-Atc', `SELECT value FROM system_config WHERE code='${code}'`], { encoding: 'utf8' }).trim();
  return JSON.parse(text);
}
async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('이메일').fill('admin@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/auth/login' && r.request().method() === 'POST');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page).toHaveURL(/\/(?:profile|onboarding\/agree-terms)/);
  const agreements = await page.request.get('/api/v1/terms/agreements');
  expect(agreements.status()).toBe(200);
  const items = (await agreements.json()).data.items;
  if (items.some((item: { isAgreed: boolean }) => !item.isAgreed)) {
    const agreed = await page.request.post('/api/v1/terms/agreements', { headers, data: {
      agreements: items.map((item: { termId: string }) => ({ termId: item.termId, isAgreed: true })),
    } });
    expect(agreed.status(), await agreed.text()).toBe(200);
  }
}
async function save(page: Page, name = '저장') {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/system-config' && r.request().method() === 'PATCH');
  await page.getByRole('button', { name, exact: true }).click();
  return response;
}

test('real settings save, partial failure, response loss, retry, OAuth validation and upload authorization', async ({ page, request }, testInfo) => {
  test.setTimeout(180_000);
  await login(page);
  console.log('Authenticated through browser login; required terms arranged through real API.');
  try {
    const baseline = await page.request.patch('/api/v1/system-config', { headers, data: {
      adminEmail: { from: 'baseline@example.com', smtpHost: '127.0.0.1', smtpPort: 1, smtpSecure: false, smtpUser: 'e2e', smtpPassword: 'isolated-test-only' },
      webhook: { enabled: true, type: 'SLACK', cooldownMinutes: 10, webhookUrl: 'http://127.0.0.1:9/e2e' },
    } });
    expect(baseline.status(), await baseline.text()).toBe(200);
    await page.goto('/system-settings#notifications');
    await page.getByRole('tab', { name: '시스템 알림', exact: true }).click();
    await page.getByLabel('기본 발신 주소').fill('saved@example.com');
    await page.getByLabel('재알림 간격').fill('11');
    const success = await save(page);
    expect(success.status(), await success.text()).toBe(200);
    expect((await success.json()).data).toMatchObject({ ok: true, syncedKeys: ['webhook'], unconfirmedKeys: [] });
    expect(readDatabase('admin_e2e', 'email').from).toBe('saved@example.com');
    expect(readDatabase('admin_e2e', 'webhook').cooldownMinutes).toBe(11);
    expect(readDatabase('service_e2e', 'webhook').cooldownMinutes).toBe(11);
    await expect(page.getByLabel('기본 발신 주소')).toHaveValue('saved@example.com');

    for (const [mode, email, cooldown] of [['before', 'partial@example.com', 12], ['after', 'response-lost@example.com', 13]] as const) {
      await page.getByLabel('기본 발신 주소').fill(email);
      await page.getByLabel('재알림 간격').fill(String(cooldown));
      const injection = await request.post(`${proxy}/__fault`, { data: { mode } });
      expect(injection.status()).toBe(200);
      const failure = await save(page);
      expect(failure.status(), await failure.text()).toBe(503);
      const body = await failure.json();
      expect(body.errorCode).toBe('SYSTEM_CONFIG_UPDATE_INCOMPLETE');
      expect(body.details.updatedKeys).toEqual(['adminEmail', 'webhook']);
      expect(body.details.unconfirmedKeys).toEqual(['webhook']);
      expect(readDatabase('admin_e2e', 'email').from).toBe(email);
      expect(readDatabase('admin_e2e', 'webhook').cooldownMinutes).toBe(cooldown);
      expect(readDatabase('service_e2e', 'webhook').cooldownMinutes).toBe(mode === 'before' ? 11 : cooldown);
      await expect(page.getByRole('alert').filter({ hasText: '서비스 반영 미확인' })).toContainText('회사 메신저 웹훅');
      await expect(page.getByLabel('기본 발신 주소')).toHaveValue(email);
      await page.screenshot({ path: testInfo.outputPath(`${mode}-retry.png`) });
      const retry = await save(page, '저장 재시도');
      expect(retry.status(), await retry.text()).toBe(200);
      expect(readDatabase('service_e2e', 'webhook').cooldownMinutes).toBe(cooldown);
      const persisted = await page.request.get('/api/v1/system-config');
      expect(persisted.status()).toBe(200);
      expect((await persisted.json()).data).toMatchObject({ adminEmail: { from: email }, webhook: { cooldownMinutes: cooldown } });
      await expect(page.getByRole('button', { name: '저장', exact: true })).toBeEnabled();
    }

    const beforeInvalid = readDatabase('service_e2e', 'oauth');
    const invalid = await page.request.patch('/api/v1/system-config', { headers, data: { oauth: { e2e: { enabled: 'invalid' } } } });
    expect(invalid.status()).toBe(400);
    expect(readDatabase('service_e2e', 'oauth')).toEqual(beforeInvalid);
    const oauth = readDatabase('service_e2e', 'oauth');
    const valid = await page.request.patch('/api/v1/system-config', { headers, data: { oauth: { ...oauth, e2e: { enabled: false, name: 'E2E custom', clientId: '', clientSecret: '' } } } });
    expect(valid.status(), await valid.text()).toBe(200);
    expect(readDatabase('service_e2e', 'oauth').e2e.name).toBe('E2E custom');

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
    const issued = await page.request.post('/api/v1/system-config/oauth-icon/presigned-url', { headers, data: { filename: 'config-e2e.png', contentType: 'image/png', fileSize: png.length } });
    expect(issued.status(), await issued.text()).toBe(201);
    const icon = (await issued.json()).data;
    const denied = await request.put(`http://localhost:14101${icon.uploadUrl}`, { data: png, headers: { 'Content-Type': 'image/png' } });
    expect(denied.status()).toBe(401);
    const uploaded = await page.request.put(icon.uploadUrl, { data: png, headers: { ...headers, 'Content-Type': 'image/png' } });
    expect(uploaded.status(), await uploaded.text()).toBe(200);
    const currentOAuth = readDatabase('service_e2e', 'oauth');
    const attach = await page.request.patch('/api/v1/system-config', { headers, data: { oauth: { ...currentOAuth, e2e: { ...currentOAuth.e2e, iconUrl: icon.fileUrl } } } });
    expect(attach.status(), await attach.text()).toBe(200);
    const imagePath = `/api/v1/uploads/oauth-icons/${new URL(icon.fileUrl, origin).pathname.split('/').pop()}`;
    const image = await request.get(`${origin}${imagePath}`);
    expect(image.status()).toBe(200);
    expect(await image.body()).toEqual(png);
    const overwrite = await page.request.put(icon.uploadUrl, { data: png, headers: { ...headers, 'Content-Type': 'image/png' } });
    expect(overwrite.status()).toBe(400);
    expect(await (await request.get(`${origin}${imagePath}`)).body()).toEqual(png);
  }
  finally {
    await page.request.post('/api/v1/auth/logout', { headers });
    await request.post(`${proxy}/__fault`, { data: { mode: 'none' } });
  }
});

test('operational settings persist through the service form without changing system settings', async ({ page, request }) => {
  await login(page);
  try {
    const beforeSystem = readDatabase('service_e2e', 'oauth');
    const beforeEmail = readDatabase('admin_e2e', 'email');
    await page.goto('/service-settings#inquiry');
    const greeting = `통합 검증 인사말 ${Date.now()}`;
    await page.getByLabel('인사말').fill(greeting);
    const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/service-config' && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    const saved = await response;
    expect(saved.status(), await saved.text()).toBe(200);
    expect(readDatabase('service_e2e', 'inquiry').customerGreeting).toBe(greeting);
    const adminRead = await page.request.get('/api/v1/service-config');
    expect(adminRead.status()).toBe(200);
    const adminConfig = (await adminRead.json()).data;
    expect(adminConfig.inquiry.customerGreeting).toBe(greeting);
    const publicRead = await request.get('http://localhost:4101/api/v1/service-configs');
    expect(publicRead.status(), await publicRead.text()).toBe(200);
    expect((await publicRead.json()).data).toMatchObject({ operation: adminConfig.operation, maintenance: adminConfig.maintenance });
    expect(readDatabase('service_e2e', 'oauth')).toEqual(beforeSystem);
    expect(readDatabase('admin_e2e', 'email')).toEqual(beforeEmail);
    await page.reload();
    await expect(page.getByLabel('인사말')).toHaveValue(greeting);
  }
  finally {
    await page.request.post('/api/v1/auth/logout', { headers });
  }
});
