import { expect, test } from '@playwright/test';

test('notice dates persist drafts and schedules, publish now, and hide cleared dates', async ({ page, playwright }) => {
  const login = await page.request.post('/api/v1/auth/login', {
    data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
  });
  expect(login.status()).toBe(200);
  const publicApi = await playwright.request.newContext({ baseURL: process.env.SERVICE_API_URL ?? 'http://localhost:4000' });
  const title = `notice-publication-e2e-${Date.now()}`;
  let id: string | undefined;
  const readAdmin = async () => {
    const response = await page.request.get(`/api/v1/notices?search=${encodeURIComponent(title)}`);
    expect(response.ok()).toBeTruthy();
    return (await response.json()).data.items.find((item: { id: string }) => item.id === id);
  };
  const expectPublic = async (visible: boolean) => {
    const detail = await publicApi.get(`/api/v1/notices/${id}`);
    expect(detail.status()).toBe(visible ? 200 : 404);
    const list = await publicApi.get(`/api/v1/notices?search=${encodeURIComponent(title)}`);
    expect(list.status()).toBe(200);
    expect((await list.json()).data.items.some((item: { id: string }) => item.id === id)).toBe(visible);
  };
  const edit = async () => {
    await page.reload();
    const row = page.getByRole('row').filter({ hasText: title });
    await row.getByRole('button', { name: '공지 관리' }).click();
    await page.getByRole('menuitem', { name: '수정', exact: true }).click();
    return page.getByRole('dialog');
  };
  const save = async () => {
    const saved = page.waitForResponse((response) => response.url().endsWith(`/api/v1/notices/${id}`) && response.request().method() === 'PATCH');
    await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };
  try {
    await page.goto('/notices');
    await page.getByRole('button', { name: '공지 등록' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: /^제목/ }).fill(title);
    await dialog.getByRole('textbox', { name: '내용', exact: true }).fill('게시 일시 검증 본문');
    const createdResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/notices') && response.request().method() === 'POST');
    await dialog.getByRole('button', { name: '저장', exact: true }).click();
    const created = await createdResponse;
    expect(created.status()).toBe(201);
    id = (await created.json()).data.id;
    expect((await readAdmin()).publishedAt).toBeNull();
    expect(await readAdmin()).not.toHaveProperty('status');
    await expectPublic(false);

    const scheduleDialog = await edit();
    await scheduleDialog.getByRole('button', { name: /게시 일시/ }).click();
    await page.locator('.rdp-button_next').click();
    await page.locator('[role=gridcell]:not([data-outside]) button').filter({ hasText: /^1$/ }).click();
    await page.keyboard.press('Escape');
    await save();
    const scheduled = await readAdmin();
    expect(new Date(scheduled.publishedAt).getTime()).toBeGreaterThan(Date.now());
    await expectPublic(false);
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: title })).toContainText('예약');

    const publishDialog = await edit();
    await publishDialog.getByRole('button', { name: '지금 게시', exact: true }).click();
    await save();
    const published = await readAdmin();
    expect(new Date(published.publishedAt).getTime()).toBeLessThanOrEqual(Date.now());
    await expectPublic(true);

    const draftDialog = await edit();
    await draftDialog.getByRole('button', { name: '임시저장', exact: true }).click();
    await save();
    expect((await readAdmin()).publishedAt).toBeNull();
    await expectPublic(false);
  } finally {
    if (id) expect((await page.request.delete(`/api/v1/notices/${id}`)).ok()).toBeTruthy();
    await publicApi.dispose();
  }
});
