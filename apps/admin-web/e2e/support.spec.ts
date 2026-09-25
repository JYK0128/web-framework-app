import { expect, test, type Page } from '@playwright/test';

const SERVICE_WEB_URL = process.env.SERVICE_WEB_URL ?? 'http://localhost:3000';

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('이메일').fill('admin@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/auth/login'));
  await page.getByRole('button', { name: '로그인' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  return (await response.json()).data.accessToken as string;
}

test('admin lists a support room, replies, and updates its status in the browser', async ({ page, request }) => {
  const customerLogin = await request.post(`${SERVICE_WEB_URL}/api/v1/auth/login`, {
    data: { email: 'user@test.com', password: '1q2w3e4r1@', rememberMe: true },
  });
  expect(customerLogin.status()).toBe(200);
  const customerToken = (await customerLogin.json()).data.accessToken as string;
  const title = `E2E admin support ${Date.now()}`;
  const created = await request.post(`${SERVICE_WEB_URL}/api/v1/support/rooms`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    data: { title, content: 'E2E message for admin' },
  });
  expect(created.status()).toBe(201);
  const roomId = (await created.json()).data.id as string;
  let adminToken: string | undefined;

  try {
    adminToken = await login(page);
    const listResponse = page.waitForResponse((response) => response.url().includes('/api/v1/support/rooms') && response.request().method() === 'GET');
    await page.goto('/support');
    expect((await listResponse).status()).toBe(200);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '고객지원', level: 1 })).toBeVisible();
    await page.getByPlaceholder('고객 또는 상담 제목 검색...').fill(title);
    await page.waitForTimeout(500);
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('E2E message for admin')).toBeVisible();
    await dialog.getByLabel('메시지').fill('E2E admin reply');
    const replyResponse = page.waitForResponse((response) => response.url().endsWith(`/api/v1/support/rooms/${roomId}/messages`) && response.request().method() === 'POST');
    await dialog.getByRole('button', { name: '전송' }).click();
    expect((await replyResponse).status()).toBe(201);
    await expect(dialog.getByText('E2E admin reply')).toBeVisible();
  } finally {
    if (adminToken) {
      await page.request.patch(`/api/v1/support/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { status: 'closed' },
      });
    }
  }
});
