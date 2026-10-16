import { expect, test } from '@playwright/test';

test('customer submits a question and opens its details from the Q&A screen', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  const email = page.getByLabel('이메일');
  await expect.poll(() => email.evaluate((element) => Object.keys(element).some((key) => key.startsWith('__reactProps$')))).toBe(true);
  await email.fill('user@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  const onboarding = page.getByRole('heading', { name: /약관/ });
  if (await onboarding.isVisible().catch(() => false)) {
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto('/qna');
  const title = `E2E 문의 ${Date.now()}`;
  await page.getByRole('button', { name: '문의 등록' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: '분류' }).click();
  await page.getByRole('option', { name: '서비스 이용' }).click();
  await dialog.getByLabel('제목').fill(title);
  await dialog.getByLabel('문의 내용').fill('브라우저에서 등록한 문의입니다.');
  await dialog.getByRole('button', { name: '문의 등록' }).click();

  const row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByRole('dialog').getByText(title, { exact: true })).toBeVisible();
});
