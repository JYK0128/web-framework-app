import { expect, test, type Page } from '@playwright/test';

const SERVICE_EMAIL = 'user@test.com';
const SERVICE_PASSWORD = '1q2w3e4r1@';

async function loginThroughScreen(page: Page) {
  const response = await page.request.post('/api/v1/auth/login', {
    data: { email: SERVICE_EMAIL, password: SERVICE_PASSWORD, rememberMe: true },
  });
  expect(response.status()).toBe(200);
}

test.describe('Service application public flows', () => {
  test('shows only published FAQ results and applies search through the API', async ({ page, request }) => {
    const listResponse = await request.get('/api/v1/faqs?limit=20');
    expect(listResponse.status()).toBe(200);
    const items = (await listResponse.json()).data.items as Array<{ question: string, isPublished: boolean }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.isPublished)).toBe(true);

    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: 'FAQ', level: 1 })).toBeVisible();
    const searchResponse = page.waitForResponse((response) => response.url().includes('/api/v1/faqs') && response.url().includes('search=') && response.request().method() === 'GET');
    await page.goto('/faq?search=%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8');
    expect((await searchResponse).status()).toBe(200);
    await expect(page.getByText('비밀번호를 잊어버렸어요.')).toBeVisible();
    await expect(page.getByText('공개되지 않은 FAQ도 볼 수 있나요.')).toHaveCount(0);
  });

  test('loads published service terms and details through the public API', async ({ page, request }) => {
    const listResponse = await request.get('/api/v1/service-terms');
    expect(listResponse.status()).toBe(200);
    const item = (await listResponse.json()).data.items[0] as { id: string, title: string };
    const detailResponse = await request.get(`/api/v1/service-terms/${item.id}`);
    expect(detailResponse.status()).toBe(200);

    await page.goto('/service-terms');
    await expect(page.getByRole('heading', { name: '서비스 약관', level: 1 })).toBeVisible();
    await expect(page.getByText(item.title, { exact: true })).toBeVisible();
  });

  test('rejects unauthenticated Q&A API access and bad login', async ({ page, request }) => {
    const protectedResponse = await request.get('/api/v1/qna');
    expect(protectedResponse.status()).toBe(401);
    await page.goto('/login');
    const response = await page.request.post('/api/v1/auth/login', {
      data: { email: SERVICE_EMAIL, password: 'wrong-password', rememberMe: false },
    });
    expect(response.status()).toBe(401);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Service customer Q&A flow', () => {
  test('validates, creates, reads, and deletes a customer question from the screen', async ({ page }) => {
    await loginThroughScreen(page);
    await page.goto('/app/qna');
    const title = `E2E customer question ${Date.now()}`;
    await page.getByRole('button', { name: '문의 등록' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '문의 등록' }).click();
    await expect(dialog.getByText('제목을 입력해 주세요.')).toBeVisible();

    await dialog.getByLabel('분류').click();
    await page.getByRole('option', { name: '서비스 이용' }).click();
    await dialog.getByLabel('제목').fill(title);
    await dialog.getByLabel('문의 내용').fill('E2E question content');
    const createResponse = page.waitForResponse((item) => item.url().endsWith('/api/v1/qna') && item.request().method() === 'POST');
    await dialog.getByRole('button', { name: '문의 등록' }).click();
    expect((await createResponse).status()).toBe(201);
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row).toBeVisible();

    const detailResponse = page.waitForResponse((item) => item.url().includes('/api/v1/qna/') && item.request().method() === 'GET');
    await row.getByRole('button', { name: '도구' }).click();
    await row.getByRole('button', { name: '보기' }).click();
    expect((await detailResponse).status()).toBe(200);
    await expect(page.getByRole('dialog').getByText(title, { exact: true })).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: '닫기' }).click();
    const deleteResponse = page.waitForResponse((item) => item.url().includes('/api/v1/qna/') && item.request().method() === 'DELETE');
    await row.getByRole('button', { name: '도구' }).click();
    await row.getByRole('button', { name: '삭제' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '확인' }).click();
    expect((await deleteResponse).status()).toBe(200);
    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0);
  });

  test('renders an actionable error when the Q&A list API fails', async ({ page }) => {
    await loginThroughScreen(page);
    await page.route('**/api/v1/qna**', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Q&A service unavailable' }) });
    });
    const response = page.waitForResponse((item) => item.url().includes('/api/v1/qna'));
    await page.goto('/app/qna');
    expect((await response).status()).toBe(503);
    await expect(page.getByText('문의 목록을 불러오지 못했습니다.')).toBeVisible();
  });
});
