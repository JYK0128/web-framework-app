import { expect, test } from '@playwright/test';

test.describe('Customer content', () => {
  test('public FAQ supports search and hides unpublished records', async ({ page, request }) => {
    const list = await request.get('/api/v1/faqs?search=공개되지%20않은');
    expect(list.status()).toBe(200);
    const body = await list.json() as { data: { items: Array<{ question: string, isPublished: boolean }> } };
    expect(body.data.items).toHaveLength(0);

    const published = await request.get('/api/v1/faqs?limit=1');
    const publishedBody = await published.json() as { data: { items: Array<{ id: string }> } };
    const detail = await request.get(`/api/v1/faqs/${publishedBody.data.items[0].id}`);
    expect(detail.status()).toBe(200);
    expect((await detail.json()).data.isPublished).toBe(true);

    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: 'FAQ', level: 1 })).toBeVisible();
    await page.getByPlaceholder('질문 또는 답변 검색').fill('비밀번호');
    await page.getByRole('button', { name: '검색' }).click();
    await expect(page.getByText('비밀번호를 잊어버렸어요.')).toBeVisible();
    await expect(page.getByText('공개되지 않은 FAQ도 볼 수 있나요.')).toHaveCount(0);
  });

  test('published service terms are public and authenticated user can save agreement', async ({ page, request }) => {
    const terms = await request.get('/api/v1/service-terms');
    expect(terms.status()).toBe(200);
    expect((await terms.json()).data.items.length).toBeGreaterThan(0);

    await page.goto('/service-terms');
    await expect(page.getByRole('heading', { name: '서비스 약관' })).toBeVisible();

    const login = await request.post('/api/v1/auth/login', { data: { email: 'user@test.com', password: '1q2w3e4r1@' } });
    expect(login.status()).toBe(200);
    const accessToken = (await login.json()).data.accessToken as string;
    const termId = (await terms.json()).data.items[0].id as string;
    const before = await request.get('/api/v1/service-terms/agreements', { headers: { Authorization: `Bearer ${accessToken}` } });
    expect(before.status()).toBe(200);
    const save = await request.post('/api/v1/service-terms/agreements', { headers: { Authorization: `Bearer ${accessToken}` }, data: { agreements: [{ termId, isAgreed: true }] } });
    expect(save.status()).toBe(200);
    const after = await request.get('/api/v1/service-terms/agreements', { headers: { Authorization: `Bearer ${accessToken}` } });
    expect((await after.json()).data.items.find((item: { termId: string }) => item.termId === termId).isAgreed).toBe(true);
  });
});
