import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/auth';
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
}

test('admin lists a support room, replies, and updates its status in the browser', async ({ page, request }) => {
  test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'This paired workflow requires service credential login.');
  const customerLogin = await request.post(`${SERVICE_WEB_URL}/api/v1/auth/login`, {
    headers: { Origin: new URL(SERVICE_WEB_URL).origin },
    data: { email: 'user@test.com', password: '1q2w3e4r1@', rememberMe: true },
  });
  expect(customerLogin.status()).toBe(200);
  const uniqueSuffix = Date.now().toString(36).replace(/\d/g, (digit) => String.fromCharCode(97 + Number(digit)));
  const title = `E2E admin support ${uniqueSuffix}`;
  const created = await request.post(`${SERVICE_WEB_URL}/api/v1/support/rooms`, {
    headers: { Origin: new URL(SERVICE_WEB_URL).origin },
    data: { content: title },
  });
  expect(created.status()).toBe(201);
  const roomId = (await created.json()).data.id as string;
  let adminAuthenticated = false;

  try {
    await login(page);
    adminAuthenticated = true;
    const listResponse = page.waitForResponse((response) => response.url().includes('/api/v1/support/rooms') && response.request().method() === 'GET');
    await page.goto('/support');
    expect((await listResponse).status()).toBe(200);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '고객지원', level: 1 })).toBeVisible();
    const apiRoomResponse = await page.request.get(`/api/v1/support/rooms?search=${encodeURIComponent(title)}`, {

    });
    expect(apiRoomResponse.status()).toBe(200);
    const apiRooms = (await apiRoomResponse.json()).data.items as Array<{ id: string; title: string }>;
    expect(apiRooms).toContainEqual(expect.objectContaining({ id: roomId, title }));
    await page.getByPlaceholder('고객 또는 상담 제목 검색...').fill(title);
    const searchResponse = await page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.endsWith('/api/v1/support/rooms') && url.searchParams.get('search') === title && response.request().method() === 'GET';
    });
    expect(searchResponse.status()).toBe(200);
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(title)).toBeVisible();
    await dialog.getByLabel('메시지').fill('E2E admin reply');
    const replyResponse = page.waitForResponse((response) => response.url().endsWith(`/api/v1/support/rooms/${roomId}/messages`) && response.request().method() === 'POST');
    await dialog.getByRole('button', { name: '전송' }).click();
    expect((await replyResponse).status()).toBe(201);
    await expect(dialog.getByText('E2E admin reply')).toBeVisible();
    const messagesResponse = await page.request.get(`/api/v1/support/rooms/${roomId}/messages`, {

    });
    expect(messagesResponse.status()).toBe(200);
    const messages = (await messagesResponse.json()).data.items as Array<{ content: string }>;
    expect(messages.some((message) => message.content === 'E2E admin reply')).toBe(true);

    const closeResponse = page.waitForResponse((response) => response.url().endsWith(`/api/v1/support/rooms/${roomId}`) && response.request().method() === 'PATCH');
    await dialog.getByRole('button', { name: '상담 종료' }).click();
    expect((await closeResponse).status()).toBe(200);
    const closedRoom = await page.request.get(`/api/v1/support/rooms/${roomId}`, {

    });
    expect(closedRoom.status()).toBe(200);
    expect((await closedRoom.json()).data.status).toBe('closed');
    await expect(dialog.getByPlaceholder('종료된 상담입니다.')).toBeDisabled();
  } finally {
    if (adminAuthenticated) {
      await page.request.patch(`/api/v1/support/rooms/${roomId}`, {

        data: { status: 'closed' },
      });
    }
  }
});
