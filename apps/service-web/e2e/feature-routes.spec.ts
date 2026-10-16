import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { expect, test } from '@playwright/test';

test('public service pages open and FAQ filters update the visible URL state', async ({ page }) => {
  const screens = [
    ['/', 'Service Web'], ['/faq', 'FAQ'], ['/notices', '공지사항'],
    ['/events', '이벤트'], ['/service-terms', '서비스 약관'],
  ] as const;
  for (const [path, title] of screens) {
    await page.goto(path);
    await expect(page.locator('main').getByText(title, { exact: false }).first()).toBeVisible();
  }

  await page.goto('/faq');
  const allCategory = page.getByRole('group', { name: 'FAQ 카테고리' }).getByRole('button', { name: '전체' });
  await expect(allCategory).toHaveAttribute('aria-pressed', 'true');
  const search = page.getByPlaceholder('질문 또는 답변 검색');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await search.fill('존재하지 않는 문의 검색');
  await expect(page).toHaveURL(/search=/);
  await expect(search).toHaveValue('존재하지 않는 문의 검색');
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(page).toHaveURL(/\/faq(?:\?|$)/);
});

test('authenticated customer can open all protected service pages', async ({ page }) => {
  test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');
  await page.goto('/login');
  const email = page.getByLabel('이메일');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await email.fill('user@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  if (await page.getByRole('heading', { name: /약관/ }).isVisible().catch(() => false)) {
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }
  await expect(page).not.toHaveURL(/\/login/);

  for (const [path, title] of [['/qna', 'Q&A'], ['/support', '고객지원'], ['/profile', '내 프로필']] as const) {
    await page.goto(path);
    await expect(page.locator('main').getByText(title, { exact: false }).first()).toBeVisible();
  }
});
