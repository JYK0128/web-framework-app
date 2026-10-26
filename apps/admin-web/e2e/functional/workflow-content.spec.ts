import { expect, test } from '@playwright/test';

test('operator publishes a draft notice, edits it, reloads it, and deletes it', async ({ page }) => {
  await signInAdmin(page);
  await page.goto('/notices');

  const title = `E2E 공지 ${Date.now()}`;
  const updatedTitle = `${title} 수정`;
  const addButton = page.getByRole('button', { name: '공지 등록' });
  await waitForHydration(addButton);
  await addButton.click();

  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('제목').fill(title);
  await dialog.getByRole('textbox', { name: '내용' }).fill('브라우저에서 만든 공지 본문');
  await dialog.getByRole('combobox', { name: '중요도' }).click();
  await page.getByRole('option', { name: '중요' }).click();
  await dialog.getByRole('checkbox', { name: '상단 고정' }).click();
  await dialog.getByRole('button', { name: '임시저장' }).click();
  await dialog.getByRole('button', { name: '저장', exact: true }).click();

  let row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toContainText('임시저장');
  await page.reload();
  row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toContainText('중요');
  await expect(row).toContainText('임시저장');

  await row.getByRole('button', { name: '공지 관리' }).click();
  await page.getByRole('menuitem', { name: '수정' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('제목').fill(updatedTitle);
  await dialog.getByRole('textbox', { name: '내용' }).fill('수정한 공지 본문');
  await dialog.getByRole('button', { name: '저장', exact: true }).click();
  row = page.getByRole('row').filter({ hasText: updatedTitle });
  await expect(row).toBeVisible();
  await page.reload();
  row = page.getByRole('row').filter({ hasText: updatedTitle });
  await row.getByRole('button', { name: new RegExp(updatedTitle) }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('수정한 공지 본문');
  await dialog.getByRole('button', { name: '닫기' }).click();

  await row.getByRole('button', { name: '공지 관리' }).click();
  await page.getByRole('menuitem', { name: '삭제' }).click();
  const confirmation = page.getByRole('alertdialog');
  await confirmation.getByRole('button', { name: '확인' }).click();
  await expect(page.getByRole('row').filter({ hasText: updatedTitle })).toHaveCount(0);
});

async function signInAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  const email = page.getByLabel('이메일');
  await waitForHydration(email);
  await email.fill('admin@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  if (page.url().includes('/onboarding/agree-terms')) {
    const termsButton = page.getByRole('button', { name: /내용 보기$/ });
    await expect(termsButton.first()).toBeVisible();
    await waitForHydration(termsButton.first());
    for (let index = 0; index < await termsButton.count(); index++) {
      await termsButton.nth(index).click();
      await page.getByRole('dialog').getByRole('button', { name: '닫기' }).click();
    }
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }
}

async function waitForHydration(locator: import('@playwright/test').Locator): Promise<void> {
  await expect(locator.page().locator('html')).toHaveAttribute('data-hydrated', 'true');
}
