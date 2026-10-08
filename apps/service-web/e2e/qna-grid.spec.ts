import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { expect, test } from '@playwright/test';

test('Q&A grid connects toolbar search, column filters, sorting and delete menu to the API', async ({ page, request }) => {
  test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');
  test.setTimeout(60000);
  page.setDefaultTimeout(10000);
  const login = await request.post('/api/v1/auth/login', { data: { email: 'user@test.com', password: '1q2w3e4r1@' } });
  expect(login.status()).toBe(200);

  const prefix = `E2E-grid-${Date.now()}`;
  const ids: string[] = [];
  try {
    for (const suffix of ['A', 'B']) {
      const created = await request.post('/api/v1/qna', { data: { category: '검증', title: `${prefix}-${suffix}`, content: 'Grid behavior verification' } });
      expect(created.status()).toBe(201);
      ids.push((await created.json()).data.id);
    }
    await page.goto('/login?callback=%2Fqna');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: '이메일' }).fill('user@test.com');
    await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(/\/qna\/?$/);
    await page.getByPlaceholder('제목 또는 내용 검색').waitFor();
    await page.waitForLoadState('networkidle');
    const document = await page.reload({ waitUntil: 'networkidle' });
    expect(document?.status()).toBe(200);
    await page.getByPlaceholder('제목 또는 내용 검색').waitFor();
    const searchResponse = page.waitForResponse((response) => response.url().includes('/api/v1/qna?') && new URL(response.url()).searchParams.get('search') === prefix);
    await page.getByPlaceholder('제목 또는 내용 검색').fill(prefix);
    const searched = await searchResponse;
    expect(searched.status()).toBe(200);
    expect((await searched.json()).data.items).toHaveLength(2);
    const clearedSorting = page.waitForResponse((response) => response.url().includes('/api/v1/qna?') && !new URL(response.url()).searchParams.has('sort[]'));
    await page.getByRole('button', { name: 'createdAt 정렬', exact: true }).click();
    expect((await clearedSorting).status()).toBe(200);
    const sortedResponse = page.waitForResponse((response) => response.url().includes('/api/v1/qna?') && new URL(response.url()).searchParams.getAll('sort[]').includes('createdAt') && new URL(response.url()).searchParams.getAll('direction[]').includes('asc'));
    await page.getByRole('button', { name: 'createdAt 정렬', exact: true }).click();
    const sorted = await sortedResponse;
    expect(sorted.status()).toBe(200);
    expect((await sorted.json()).data.items.map((item: { id: string }) => item.id)).toEqual(ids);
    await expect(page.getByRole('row').filter({ hasText: prefix }).first()).toContainText(`${prefix}-A`);
    const descendingResponse = page.waitForResponse((response) => response.url().includes('/api/v1/qna?') && new URL(response.url()).searchParams.getAll('direction[]').includes('desc'));
    await page.getByRole('button', { name: 'createdAt 정렬', exact: true }).click();
    const descending = await descendingResponse;
    expect(descending.status()).toBe(200);
    expect((await descending.json()).data.items.map((item: { id: string }) => item.id)).toEqual([...ids].reverse());
    await expect(page.getByRole('row').filter({ hasText: prefix }).first()).toContainText(`${prefix}-B`);
    await page.getByRole('button', { name: 'status 검색', exact: true }).click();
    const filterResponse = page.waitForResponse((response) => response.url().includes('/api/v1/qna?') && new URL(response.url()).searchParams.get('status') === 'answered');
    await page.getByRole('button', { name: '답변 완료', exact: true }).click();
    expect((await (await filterResponse).json()).data.items).toHaveLength(0);
    await page.getByRole('button', { name: '초기화', exact: true }).click();
    await expect(page.getByPlaceholder('제목 또는 내용 검색')).toHaveValue('');
    await page.getByPlaceholder('제목 또는 내용 검색').fill(prefix);
    const row = page.getByRole('row').filter({ hasText: `${prefix}-A` });
    await row.getByRole('button', { name: '도구', exact: true }).click();
    await page.getByRole('menuitem', { name: '삭제', exact: true }).click();
    const removed = page.waitForResponse((response) => response.request().method() === 'DELETE' && response.url().includes('/api/v1/qna/'));
    await page.getByRole('alertdialog').getByRole('button', { name: '확인', exact: true }).click();
    expect((await removed).status()).toBe(200);
    const reread = await request.get(`/api/v1/qna?search=${prefix}`);
    expect((await reread.json()).data.items.map((item: { title: string }) => item.title)).toEqual([`${prefix}-B`]);
  }
  finally {
    for (const id of ids) {
      const result = await request.delete(`/api/v1/qna/${id}`);
      expect([200, 404]).toContain(result.status());
    }
    expect((await page.request.post('/api/v1/auth/logout', { data: {} })).status()).toBe(200);
    expect((await request.post('/api/v1/auth/logout', { data: {} })).status()).toBe(200);
  }
});
