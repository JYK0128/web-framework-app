import { expect, test, type Locator } from '@playwright/test';

test('user can sign in, keep the session after reload, and sign out from the profile menu', async ({ page }) => {
  await page.goto('/login?callback=%2Fcustomers');
  const emailInput = page.getByLabel('이메일');
  const passwordInput = page.getByRole('textbox', { name: '비밀번호' });
  await waitForHydration(emailInput);
  await emailInput.fill('admin@test.com');
  await passwordInput.fill('1q2w3e4r1@');
  await expect(emailInput).toHaveValue('admin@test.com');
  await expect(passwordInput).toHaveValue('1q2w3e4r1@');
  await page.getByRole('button', { name: '비밀번호 보기' }).click();
  await expect(passwordInput).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: '비밀번호 숨기기' }).click();
  const loginButton = page.getByRole('button', { name: '로그인', exact: true });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();

  await expect(page).toHaveURL(/\/onboarding\/agree-terms/);
  await reviewAndAcceptTerms(page);
  await expect(page).toHaveURL(/\/customers$/);
  await page.reload();
  await expect(page).toHaveURL(/\/customers$/);

  const profileMenuButton = page.getByRole('button', { name: /프로필 메뉴 열기|open profile menu/i });
  await waitForHydration(profileMenuButton);
  await profileMenuButton.click();
  await page.getByRole('menuitem', { name: /로그아웃|log out/i }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/customers');
  await expect(page).toHaveURL(/\/login/);
});

async function reviewAndAcceptTerms(page: import('@playwright/test').Page): Promise<void> {
  const detailsButtons = page.getByRole('button', { name: /내용 보기$/ });
  await expect(detailsButtons.first()).toBeVisible();
  await waitForHydration(detailsButtons.first());

  for (let index = 0; index < await detailsButtons.count(); index++) {
    const detailsButton = detailsButtons.nth(index);
    await detailsButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading')).toBeVisible();
    await expect(dialog.locator('.whitespace-pre-wrap')).toHaveText(/\S/);
    await dialog.getByRole('button', { name: '닫기' }).click();
  }

  await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
  await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
}

test('anonymous visitor is redirected from a protected page to sign in', async ({ page }) => {
  await page.goto('/customers');
  await expect(page).toHaveURL(/\/login/);
});

async function waitForHydration(locator: Locator): Promise<void> {
  await expect.poll(
    async () => {
      try {
        return await locator.evaluate((element) => Object.keys(element).some((key) => key.startsWith('__reactProps$')));
      }
      catch {
        return false;
      }
    },
    { timeout: 15_000, message: 'Wait for the browser UI to finish hydrating before interaction.' },
  ).toBe(true);
}
