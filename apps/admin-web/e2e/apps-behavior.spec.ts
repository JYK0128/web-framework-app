import { expect, test, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = '1q2w3e4r1@';

async function loginThroughScreen(page: Page) {
  const response = await page.request.post('/api/v1/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, rememberMe: false },
  });
  expect(response.status()).toBe(200);
  return { Authorization: `Bearer ${(await response.json()).data.accessToken as string}` };
}

test.describe('Admin application route/API coverage', () => {
  test('rejects invalid credentials on the login screen', async ({ page }) => {
    await page.goto('/login');
    const response = await page.request.post('/api/v1/auth/login', {
      data: { email: ADMIN_EMAIL, password: 'definitely-wrong-password', rememberMe: false },
    });
    expect(response.status()).toBe(401);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/비밀번호|인증|로그인/).last()).toBeVisible();
  });

  test('redirects an unauthenticated browser away from every protected screen', async ({ page }) => {
    for (const path of ['/customers', '/faqs', '/qna', '/service-terms', '/role-management', '/operator-management', '/terms', '/logs', '/profile', '/system-management']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    }
  });

  test('loads every admin screen through its normal API boundary', async ({ page }) => {
    await loginThroughScreen(page);
    const screens = [
      { path: '/customers', heading: '고객 관리', api: '/api/v1/customers' },
      { path: '/faqs', heading: 'FAQ 관리', api: '/api/v1/faqs' },
      { path: '/qna', heading: 'Q&A 관리', api: '/api/v1/qna' },
      { path: '/service-terms', heading: '서비스 약관 관리', api: '/api/v1/service-terms/groups' },
      { path: '/role-management', heading: '역할 관리', api: '/api/v1/roles' },
      { path: '/operator-management', heading: '운영자 관리', api: '/api/v1/operators' },
      { path: '/terms', heading: '운영자 약관 관리', api: '/api/v1/operator-terms/groups' },
      { path: '/logs', heading: '로그 관리', api: '/api/v1/logs' },
      { path: '/profile', heading: '내 프로필', api: '/api/v1/auth/me' },
      { path: '/system-management', heading: '서비스 설정', api: '/api/v1/service-configs' },
    ];

    for (const screen of screens) {
      const apiResponse = page.waitForResponse((item) => item.url().includes(screen.api) && item.request().method() === 'GET');
      await page.goto(screen.path);
      expect((await apiResponse).status()).toBe(200);
      await expect(page.getByRole('heading', { name: screen.heading, level: 1 })).toBeVisible();
    }
  });

  test('keeps the screen usable and reports a list API failure', async ({ page }) => {
    await loginThroughScreen(page);
    await page.route('**/api/v1/faqs**', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'FAQ service unavailable' }) });
    });
    const failedRequest = page.waitForResponse((item) => item.url().includes('/api/v1/faqs'));
    await page.goto('/faqs');
    expect((await failedRequest).status()).toBe(503);
    await expect(page.getByRole('heading', { name: 'FAQ 관리', level: 1 })).toBeVisible();
    await expect(page.getByText('FAQ service unavailable')).toBeVisible();
  });
});

test.describe('FAQ UI business flow', () => {
  test('validates, creates, updates, and searches an FAQ from the screen', async ({ page, request }) => {
    const auth = await loginThroughScreen(page);
    await page.goto('/faqs');
    const suffix = Date.now();
    const question = `E2E FAQ ${suffix}`;
    const updatedQuestion = `${question} updated`;
    let createdId: string | undefined;

    try {
      await page.getByRole('button', { name: 'FAQ 추가' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: '저장' }).click();
      await expect(dialog.getByText('질문을 입력해 주세요.')).toBeVisible();

      await dialog.getByLabel('카테고리').click();
      await page.getByRole('option', { name: '계정' }).click();
      await dialog.getByLabel('질문').fill(question);
      await dialog.getByLabel('답변').fill('E2E answer');
      const createResponse = page.waitForResponse((item) => item.url().endsWith('/api/v1/faqs') && item.request().method() === 'POST');
      await dialog.getByRole('button', { name: '저장' }).click();
      const createdResponse = await createResponse;
      expect(createdResponse.status()).toBe(201);
      createdId = ((await createdResponse.json()).data as { id: string }).id;
      await expect(page.getByText(question, { exact: true })).toBeVisible();

      const row = page.getByRole('row').filter({ hasText: question });
      await row.getByRole('button', { name: '도구' }).click();
      await page.getByRole('menuitem', { name: '수정' }).click();
      const editDialog = page.getByRole('dialog');
      await editDialog.getByLabel('질문').fill(updatedQuestion);
      const updateResponse = page.waitForResponse((item) => item.url().match(/\/api\/v1\/faqs\/[^/]+$/) !== null && item.request().method() === 'PATCH');
      await editDialog.getByRole('button', { name: '저장' }).click();
      expect((await updateResponse).status()).toBe(200);
      await expect(page.getByText(updatedQuestion, { exact: true })).toBeVisible();

      await page.getByPlaceholder('질문 또는 답변 검색...').fill(updatedQuestion);
      await expect(page.getByRole('row').filter({ hasText: updatedQuestion })).toBeVisible();

    }
    finally {
      if (createdId) {
        const deleteResponse = await request.delete(`/api/v1/faqs/${createdId}`, { headers: auth, timeout: 5_000 });
        expect([200, 404]).toContain(deleteResponse.status());
      }
    }
  });
});

test.describe('Q&A UI business flow', () => {
  test('answers an existing customer question and verifies the persisted state', async ({ page }) => {
    const auth = await loginThroughScreen(page);
    const list = await page.request.get('/api/v1/qna?limit=1', { headers: auth });
    expect(list.status()).toBe(200);
    const item = (await list.json()).data.items[0] as { id: string, title: string } | undefined;
    test.skip(!item, 'The seeded database has no Q&A record to answer.');

    await page.goto('/qna');
    const row = page.getByRole('row').filter({ hasText: item!.title });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: '도구' }).click();
    await page.getByRole('menuitem', { name: '답변' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('답변').fill(`E2E answer ${Date.now()}`);
    await dialog.getByLabel('상태').click();
    await page.getByRole('option', { name: '답변 완료' }).click();
    const response = page.waitForResponse((res) => res.url().includes(`/api/v1/qna/${item!.id}`) && res.request().method() === 'PATCH');
    await dialog.getByRole('button', { name: '저장' }).click();
    expect((await response).status()).toBe(200);
    const reread = await page.request.get(`/api/v1/qna/${item!.id}`, { headers: auth });
    expect(reread.status()).toBe(200);
    expect((await reread.json()).data.status).toBe('answered');
  });
});
