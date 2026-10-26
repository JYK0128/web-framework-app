import { expect, test } from '@playwright/test';

test('admin operator can open every application management screen', async ({ page }) => {
  await signIn(page, 'admin@test.com');

  const screens = [
    ['/customers', '고객 관리'], ['/memberships', '멤버십 관리'], ['/faqs', 'FAQ 관리'],
    ['/qna', 'Q&A 관리'], ['/support', '고객지원'], ['/service-terms', '서비스 약관 관리'],
    ['/notices', '공지사항 관리'], ['/events', '이벤트 관리'], ['/roles', '역할 관리'],
    ['/operators', '운영자 관리'], ['/terms', '약관 관리'], ['/logs', '로그 관리'],
    ['/service-settings', '서비스 설정'], ['/system-settings', '시스템 설정'], ['/profile', '프로필'],
  ] as const;

  for (const [path, title] of screens) {
    await page.goto(path);
    await expect(page.locator('main').getByText(title, { exact: false }).first()).toBeVisible();
  }
});

async function signIn(page: import('@playwright/test').Page, emailAddress: string): Promise<void> {
  await page.goto('/login');
  const email = page.getByLabel('이메일');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await email.fill(emailAddress);
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  if (await page.getByRole('heading', { name: /약관/ }).isVisible().catch(() => false)) {
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }
  await expect(page).not.toHaveURL(/\/login/);
}
