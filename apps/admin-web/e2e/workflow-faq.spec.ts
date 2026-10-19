import { expect, test } from '@playwright/test';

test('operator creates, edits, and searches an FAQ from the admin screens', async ({ page }) => {
  await page.goto('/login?callback=%2Fcustomers');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  const email = page.getByLabel('이메일');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await email.fill('admin@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  const onboarding = page.getByRole('heading', { name: /약관/ });
  if (await onboarding.isVisible().catch(() => false)) {
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }
  await expect(page).toHaveURL(/\/(?:customers|profile)$/);

  const question = `E2E FAQ ${Date.now()}`;
  const updatedQuestion = `${question} 수정`;
  await page.goto('/faqs');
  const addButton = page.getByRole('button', { name: 'FAQ 추가' });
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await addButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('카테고리').click();
  await page.getByRole('option', { name: '계정' }).click();
  await dialog.getByLabel('질문').fill(question);
  await dialog.getByLabel('답변').fill('브라우저에서 등록한 답변');
  await dialog.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('row').filter({ hasText: question })).toBeVisible();

  const row = page.getByRole('row').filter({ hasText: question });
  await row.getByRole('button', { name: '도구' }).click();
  await page.getByRole('menuitem', { name: '수정' }).click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('질문').fill(updatedQuestion);
  await editDialog.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('row').filter({ hasText: updatedQuestion })).toBeVisible();
  await page.getByPlaceholder('질문 또는 답변 검색...').fill(updatedQuestion);
  await expect(page.getByRole('row').filter({ hasText: updatedQuestion })).toBeVisible();

  await page.reload();
  await page.getByPlaceholder('질문 또는 답변 검색...').fill(updatedQuestion);
  const persistedRow = page.getByRole('row').filter({ hasText: updatedQuestion });
  await expect(persistedRow).toBeVisible();
  await persistedRow.getByRole('button', { name: '도구' }).click();
  await page.getByRole('menuitem', { name: '삭제' }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation).toContainText(updatedQuestion);
  await confirmation.getByRole('button', { name: '확인' }).click();
  await expect(page.getByRole('row').filter({ hasText: updatedQuestion })).toHaveCount(0);
});
