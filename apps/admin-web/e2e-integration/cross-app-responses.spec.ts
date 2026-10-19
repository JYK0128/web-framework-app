import { expect, test, type Page } from '@playwright/test';

const SERVICE_WEB_URL = process.env.SERVICE_WEB_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@test.com';
const CUSTOMER_EMAIL = 'user@test.com';
const PASSWORD = '1q2w3e4r1@';

function uniqueText(prefix: string): string {
  const suffix = Date.now().toString(36).replace(/\d/g, (digit) => String.fromCharCode(97 + Number(digit)));
  return `${prefix} ${suffix}`;
}

async function login(page: Page, appUrl: string, email: string): Promise<string> {
  await page.goto(`${appUrl}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel('이메일').fill(email);
  await page.getByRole('textbox', { name: '비밀번호' }).fill(PASSWORD);
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/auth/login'));
  await page.getByRole('button', { name: '로그인' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  return (await response.json()).data.accessToken as string;
}

test('Service customer Q&A receives the answer written by Admin', async ({ page, context }) => {
  const servicePage = await context.newPage();
  const title = uniqueText('E2E customer question');
  const question = `Cross-app question: ${title}`;
  const answer = `Cross-app Admin answer: ${title}`;
  let customerToken: string | undefined;
  let adminToken: string | undefined;
  let qnaId: string | undefined;

  try {
    customerToken = await login(servicePage, SERVICE_WEB_URL, CUSTOMER_EMAIL);
    await servicePage.goto(`${SERVICE_WEB_URL}/qna`);
    await servicePage.getByRole('button', { name: '문의 등록' }).click();
    const createDialog = servicePage.getByRole('dialog');
    await createDialog.getByRole('combobox', { name: '분류' }).click();
    await servicePage.getByRole('option', { name: '서비스 이용' }).click();
    await createDialog.getByLabel('제목').fill(title);
    await createDialog.getByLabel('문의 내용').fill(question);

    const createResponsePromise = servicePage.waitForResponse((response) => response.url().endsWith('/api/v1/qna') && response.request().method() === 'POST');
    await createDialog.getByRole('button', { name: '문의 등록' }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
    qnaId = (await createResponse.json()).data.id as string;

    const customerAuth = { headers: { Authorization: `Bearer ${customerToken}` } };
    const createdQna = await servicePage.request.get(`${SERVICE_WEB_URL}/api/v1/qna/${qnaId}`, customerAuth);
    expect(createdQna.status()).toBe(200);
    expect((await createdQna.json()).data).toMatchObject({ id: qnaId, title, content: question, answer: null, status: 'open' });

    adminToken = await login(page, process.env.ADMIN_WEB_URL ?? 'http://localhost:13000', ADMIN_EMAIL);
    await page.goto('/qna');
    const qnaListResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.endsWith('/api/v1/qna') && response.request().method() === 'GET';
    });
    await page.getByPlaceholder('제목 또는 내용 검색...').fill(title);
    const qnaListResponse = await qnaListResponsePromise;
    expect(qnaListResponse.status()).toBe(200);
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.click();

    const answerDialog = page.getByRole('dialog');
    await expect(answerDialog.getByText(question)).toBeVisible();
    await answerDialog.getByLabel('답변').fill(answer);
    await answerDialog.getByLabel('상태').click();
    await page.getByRole('option', { name: '답변 완료' }).click();
    const updateResponsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/v1/qna/${qnaId}`) && response.request().method() === 'PATCH');
    await answerDialog.getByRole('button', { name: '저장' }).click();
    expect((await updateResponsePromise).status()).toBe(200);

    const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
    const adminReadback = await page.request.get(`/api/v1/qna/${qnaId}`, adminAuth);
    expect(adminReadback.status()).toBe(200);
    expect((await adminReadback.json()).data).toMatchObject({ id: qnaId, answer, status: 'answered' });

    const serviceReadback = await servicePage.request.get(`${SERVICE_WEB_URL}/api/v1/qna/${qnaId}`, customerAuth);
    expect(serviceReadback.status()).toBe(200);
    expect((await serviceReadback.json()).data).toMatchObject({ id: qnaId, answer, status: 'answered' });

    await servicePage.goto(`${SERVICE_WEB_URL}/qna`);
    await servicePage.getByPlaceholder('제목 또는 내용 검색').fill(title);
    const serviceListResponsePromise = servicePage.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.endsWith('/api/v1/qna') && url.searchParams.get('search') === title && response.request().method() === 'GET';
    });
    await servicePage.getByRole('button', { name: '검색' }).click();
    expect((await serviceListResponsePromise).status()).toBe(200);
    const serviceRow = servicePage.getByRole('row').filter({ hasText: title });
    await expect(serviceRow).toBeVisible();
    const detailResponsePromise = servicePage.waitForResponse((response) => response.url().endsWith(`/api/v1/qna/${qnaId}`) && response.request().method() === 'GET');
    await serviceRow.click();
    expect((await detailResponsePromise).status()).toBe(200);
    await expect(servicePage.getByRole('dialog').getByText(answer, { exact: true })).toBeVisible();
  }
  finally {
    if (qnaId && (adminToken || customerToken)) {
      const cleanupToken = adminToken ?? customerToken!;
      const deleted = await page.request.delete(`/api/v1/qna/${qnaId}`, { headers: { Authorization: `Bearer ${cleanupToken}` } });
      expect(deleted.status()).toBe(200);
    }
    await servicePage.close();
  }
});

test('Service customer sees the reply sent by Admin in the same support room', async ({ page, context }) => {
  const servicePage = await context.newPage();
  const title = uniqueText('E2E customer support');
  const reply = `Cross-app Admin support reply: ${title}`;
  let customerToken: string | undefined;
  let adminToken: string | undefined;
  let roomId: string | undefined;

  try {
    customerToken = await login(servicePage, SERVICE_WEB_URL, CUSTOMER_EMAIL);
    await servicePage.goto(`${SERVICE_WEB_URL}/support`);
    await servicePage.getByRole('button', { name: '새 상담 시작' }).click();
    const customerDialog = servicePage.getByRole('dialog');
    await customerDialog.getByLabel('메시지').fill(title);
    const createRoomResponsePromise = servicePage.waitForResponse((response) => response.url().endsWith('/api/v1/support/rooms') && response.request().method() === 'POST');
    await customerDialog.getByRole('button', { name: '전송' }).click();
    const createRoomResponse = await createRoomResponsePromise;
    expect(createRoomResponse.status()).toBe(201);
    roomId = (await createRoomResponse.json()).data.id as string;
    await expect(customerDialog.getByText(title, { exact: true })).toBeVisible();

    const customerAuth = { headers: { Authorization: `Bearer ${customerToken}` } };
    const savedRoom = await servicePage.request.get(`${SERVICE_WEB_URL}/api/v1/support/rooms/${roomId}`, customerAuth);
    expect(savedRoom.status()).toBe(200);
    expect((await savedRoom.json()).data).toMatchObject({ id: roomId, title, status: 'open' });

    adminToken = await login(page, process.env.ADMIN_WEB_URL ?? 'http://localhost:13000', ADMIN_EMAIL);
    await page.goto('/support');
    await expect(page.getByRole('heading', { name: '고객지원', level: 1 })).toBeVisible();
    const adminListResponsePromise = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.endsWith('/api/v1/support/rooms') && url.searchParams.get('search') === title && response.request().method() === 'GET';
    });
    await page.getByPlaceholder('고객 또는 상담 제목 검색...').fill(title);
    expect((await adminListResponsePromise).status()).toBe(200);
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.click();

    const adminDialog = page.getByRole('dialog');
    await expect(adminDialog.getByText(title, { exact: true })).toBeVisible();
    await adminDialog.getByLabel('메시지').fill(reply);
    const sendResponsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/v1/support/rooms/${roomId}/messages`) && response.request().method() === 'POST');
    await adminDialog.getByRole('button', { name: '전송' }).click();
    expect((await sendResponsePromise).status()).toBe(201);

    const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
    const persistedMessages = await page.request.get(`/api/v1/support/rooms/${roomId}/messages`, adminAuth);
    expect(persistedMessages.status()).toBe(200);
    const messages = (await persistedMessages.json()).data.items as Array<{ senderType: string; content: string }>;
    expect(messages).toContainEqual(expect.objectContaining({ senderType: 'agent', content: reply }));

    await expect(customerDialog.getByText(reply, { exact: true })).toBeVisible({ timeout: 15_000 });
    const customerMessages = await servicePage.request.get(`${SERVICE_WEB_URL}/api/v1/support/rooms/${roomId}/messages`, customerAuth);
    expect(customerMessages.status()).toBe(200);
    const customerReadback = (await customerMessages.json()).data.items as Array<{ senderType: string; content: string }>;
    expect(customerReadback).toContainEqual(expect.objectContaining({ senderType: 'agent', content: reply }));
  }
  finally {
    if (roomId && customerToken) {
      const closed = await servicePage.request.patch(`${SERVICE_WEB_URL}/api/v1/support/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
        data: { status: 'closed' },
      });
      expect(closed.status()).toBe(200);
    }
    await servicePage.close();
  }
});
