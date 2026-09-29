import { expect, test, type Page } from '@playwright/test';

const SERVICE_EMAIL = 'user@test.com';
const SERVICE_PASSWORD = '1q2w3e4r1@';

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('이메일').fill(SERVICE_EMAIL);
  await page.getByRole('textbox', { name: '비밀번호' }).fill(SERVICE_PASSWORD);
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/auth/login'));
  await page.getByRole('button', { name: '로그인' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  return (await response.json()).data.accessToken as string;
}

test('customer creates a support room, exchanges messages, and closes it in the browser', async ({ page }) => {
  const accessToken = await login(page);
  const firstMessage = `E2E support ${Date.now()}`;
  let roomId: string | undefined;

  try {
    await page.goto('/support');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '고객지원', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: '새 상담 시작' }).click();
    const chatDialog = page.getByRole('dialog');
    await chatDialog.getByLabel('메시지').fill(firstMessage);
    const createResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/support/rooms') && response.request().method() === 'POST');
    await chatDialog.getByRole('button', { name: '전송' }).click();
    const created = await createResponse;
    expect(created.status()).toBe(201);
    roomId = (await created.json()).data.id as string;

    await expect(chatDialog.getByText(firstMessage)).toBeVisible();
    await chatDialog.getByLabel('메시지').fill('E2E support follow-up');
    const messageResponse = page.waitForResponse((response) => response.url().match(/\/api\/v1\/support\/rooms\/[^/]+\/messages$/) !== null && response.request().method() === 'POST');
    await chatDialog.getByRole('button', { name: '전송' }).click();
    expect((await messageResponse).status()).toBe(201);
    await expect(chatDialog.getByText('E2E support follow-up')).toBeVisible();

    const closeResponse = page.waitForResponse((response) => response.url().match(/\/api\/v1\/support\/rooms\/[^/]+$/) !== null && response.request().method() === 'PATCH');
    await chatDialog.getByRole('button', { name: '상담 종료' }).click();
    expect((await closeResponse).status()).toBe(200);
    await expect(chatDialog.getByText('종료된 상담')).toBeVisible();
    await expect(chatDialog.getByRole('button', { name: '전송' })).toBeDisabled();
  } finally {
    if (roomId) {
      await page.request.patch(`/api/v1/support/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { status: 'closed' },
      });
    }
  }
});
