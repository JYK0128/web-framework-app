import { expect, test } from '@playwright/test';

type LoginResponse = { data: { accessToken: string } };
type GroupsResponse = { data: { items: Array<{ id: string }> } };
type TermsResponse = { data: { items: Array<{ id: string, version: string, metadata?: { options?: Record<string, boolean> } | null }> } };

test('creates a term with selectable options and persists its metadata', async ({ page }) => {
  const loginResponse = await page.request.post('/api/v1/auth/login', {
    data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const accessToken = (await loginResponse.json() as LoginResponse).data.accessToken;
  const auth = { headers: { Authorization: `Bearer ${accessToken}` } };
  const suffix = Date.now();
  const optionName = `이메일 수신 동의 ${suffix}`;
  const version = `e2e-${suffix}`;
  const groupsResponse = await page.request.get('/api/v1/operator-terms/groups', auth);
  expect(groupsResponse.ok()).toBeTruthy();
  const groupId = (await groupsResponse.json() as GroupsResponse).data.items[0]?.id;
  if (!groupId) throw new Error('E2E requires a seeded operator term group.');
  let termId: string | undefined;

  try {
    await page.goto('/operator-terms');
    await expect(page.getByRole('heading', { name: '운영자 약관 관리', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: '버전 추가' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('버전').fill(version);
    await dialog.getByLabel('등록 사유').fill('E2E 선택 항목 생성');
    await dialog.getByLabel('변경 요약').fill('선택 항목 저장 확인');
    await dialog.getByLabel('본문').fill('선택 항목 저장 확인용 약관 본문입니다.');
    await dialog.getByRole('button', { name: '+ 항목 추가' }).click();
    await dialog.getByPlaceholder('예: 이메일 수신 동의').fill(optionName);
    await dialog.getByRole('button', { name: '저장' }).click();

    await expect.poll(async () => {
      const response = await page.request.get(`/api/v1/operator-terms?groupId=${groupId}`, auth);
      if (!response.ok()) return false;
      const body = await response.json() as TermsResponse;
      const term = body.data.items.find((item) => item.metadata?.options?.[optionName] === false);
      if (!term) return false;
      termId = term.id;
      return true;
    }).toBe(true);

    await page.reload();
    await page.getByRole('row').filter({ hasText: version }).getByRole('button', { name: '도구' }).click();
    await page.getByRole('menuitem', { name: '수정' }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByPlaceholder('예: 이메일 수신 동의').nth(0)).toHaveValue(optionName);
    await editDialog.getByRole('button', { name: '+ 항목 추가' }).click();
    const secondOption = `SMS 수신 동의 ${suffix}`;
    await editDialog.getByPlaceholder('예: 이메일 수신 동의').nth(1).fill(secondOption);
    await editDialog.getByRole('button', { name: '저장' }).click();

    await expect.poll(async () => {
      const response = await page.request.get(`/api/v1/operator-terms?groupId=${groupId}`, auth);
      if (!response.ok()) return false;
      const body = await response.json() as TermsResponse;
      return body.data.items.some((item) => item.id === termId
        && item.metadata?.options?.[optionName] === false
        && item.metadata?.options?.[secondOption] === false);
    }).toBe(true);
  }
  finally {
    if (!termId) {
      const response = await page.request.get(`/api/v1/operator-terms?groupId=${groupId}&search=${encodeURIComponent(version)}`, auth);
      if (response.ok()) {
        const body = await response.json() as TermsResponse;
        termId = body.data.items.find((item) => item.version === version)?.id;
      }
    }
    if (termId) {
      const response = await page.request.delete(`/api/v1/operator-terms/${termId}`, auth);
      expect(response.ok()).toBeTruthy();
    }
  }
});
