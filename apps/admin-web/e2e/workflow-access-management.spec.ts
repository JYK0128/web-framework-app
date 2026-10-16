import { expect, test } from '@playwright/test';

test('operator creates, updates, persists and removes a customer membership', async ({ page }) => {
  await signInAdmin(page);
  await page.goto('/memberships');

  const code = `e2e-${Date.now()}`;
  const label = `E2E 멤버십 ${Date.now()}`;
  const addMembershipButton = page.getByRole('button', { name: '멤버십 추가' });
  await waitForHydration(addMembershipButton);
  await addMembershipButton.click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('멤버십 코드').fill(code);
  await dialog.getByLabel('멤버십 이름').fill(label);
  await dialog.getByLabel('설명').fill('브라우저에서 만든 멤버십');
  await dialog.getByRole('button', { name: '저장' }).click();

  const membership = page.getByRole('button', { name: new RegExp(label) });
  await expect(membership).toBeVisible();
  await expect(page.locator('main').getByText('브라우저에서 만든 멤버십')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: new RegExp(label) }).click();
  await expect(page.locator('main').getByText('브라우저에서 만든 멤버십')).toBeVisible();

  const editButton = page.getByRole('button', { name: '수정' });
  await waitForHydration(editButton);
  await editButton.click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('멤버십 이름').fill(`${label} 수정`);
  await dialog.getByLabel('설명').fill('수정된 설명');
  await dialog.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('button', { name: new RegExp(`${label} 수정`) })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: new RegExp(`${label} 수정`) }).click();
  await expect(page.getByText('수정된 설명')).toBeVisible();

  await page.getByRole('button', { name: '삭제' }).click();
  const confirmation = page.getByRole('alertdialog');
  await confirmation.getByRole('button', { name: '확인' }).click();
  await expect(page.getByRole('button', { name: new RegExp(`${label} 수정`) })).toHaveCount(0);
});

test('operator creates and removes a role with browser interactions', async ({ page }) => {
  await signInAdmin(page);
  await page.goto('/roles');

  const code = `e2e-${Date.now()}`;
  const label = `E2E 역할 ${Date.now()}`;
  const addRoleButton = page.getByRole('button', { name: '역할 추가' });
  await waitForHydration(addRoleButton);
  await addRoleButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('역할 코드').fill(code);
  await dialog.getByLabel('역할 이름').fill(label);
  await dialog.getByLabel('설명').fill('브라우저에서 생성한 테스트 역할');
  await dialog.getByRole('button', { name: '저장' }).click();

  const role = page.getByRole('button', { name: new RegExp(label) });
  await expect(role).toBeVisible();
  await role.click();
  await expect(page.getByText('브라우저에서 생성한 테스트 역할')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: new RegExp(label) }).click();
  await expect(page.getByText('브라우저에서 생성한 테스트 역할')).toBeVisible();

  await page.getByRole('button', { name: '삭제' }).click();
  const confirmation = page.getByRole('alertdialog');
  await confirmation.getByRole('button', { name: '확인' }).click();
  await expect(page.getByRole('button', { name: new RegExp(label) })).toHaveCount(0);
});

async function signInAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  const email = page.getByLabel('이메일');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await email.fill('admin@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\/agree-terms|\/(?:customers|profile)$/);
  if (page.url().includes('/onboarding/agree-terms')) {
    const detailsButtons = page.getByRole('button', { name: /내용 보기$/ });
    await expect(detailsButtons.first()).toBeVisible();
    await waitForHydration(detailsButtons.first());
    for (let index = 0; index < await detailsButtons.count(); index++) {
      await detailsButtons.nth(index).click();
      const detail = page.getByRole('dialog');
      await expect(detail.locator('.whitespace-pre-wrap')).toHaveText(/\S/);
      await detail.getByRole('button', { name: '닫기' }).click();
    }
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }
  await expect(page).toHaveURL(/\/(?:customers|profile)$/);
}

async function waitForHydration(locator: import('@playwright/test').Locator): Promise<void> {
  await expect(locator.page().locator('html')).toHaveAttribute('data-hydrated', 'true');
}
