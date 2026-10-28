import { expect, test } from '@playwright/test';

test('customer submits a question and opens its details from the Q&A screen', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  const email = page.getByLabel('이메일');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await email.fill('user@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  const onboarding = page.getByRole('heading', { name: /약관/ });
  if (await onboarding.isVisible().catch(() => false)) {
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    const agreementResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/service-terms/agreements') && response.request().method() === 'POST');
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
    const response = await agreementResponse;
    expect(response.status(), await response.text()).toBe(200);
  }
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto('/qna');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  const title = `E2E 문의 ${Date.now()}`;
  await page.getByRole('button', { name: '문의 등록' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '문의 등록' }).click();
  await expect(dialog.getByLabel('분류')).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByLabel('제목')).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByLabel('문의 내용')).toHaveAttribute('aria-invalid', 'true');
  await dialog.getByRole('combobox', { name: '분류' }).click();
  await page.getByRole('option', { name: '서비스 이용' }).click();
  await dialog.getByLabel('제목').fill(title);
  await dialog.getByLabel('문의 내용').fill('브라우저에서 등록한 문의입니다.');
  await dialog.getByRole('button', { name: '문의 등록' }).click();

  await page.reload();
  const row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByRole('dialog').getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('브라우저에서 등록한 문의입니다.')).toBeVisible();
  await page.getByRole('button', { name: '닫기' }).click();

  await page.getByRole('row').filter({ hasText: title }).getByRole('button', { name: '도구' }).click();
  await page.getByRole('menuitem', { name: '삭제' }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation).toContainText(title);
  await confirmation.getByRole('button', { name: '확인' }).click();
  await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0);
});
