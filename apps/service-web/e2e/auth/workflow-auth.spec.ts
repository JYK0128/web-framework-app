import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { expect, test, type Locator } from '@playwright/test';

test.describe('Service Web Authentication Flow', () => {
  test('user can sign in, keep the session after reload, and sign out from the profile menu', async ({ page }) => {
    test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');

    await page.goto('/login?callback=%2Fqna');
    const emailInput = page.getByLabel('이메일');
    const passwordInput = page.getByRole('textbox', { name: '비밀번호' });
    await waitForHydration(emailInput);
    await emailInput.fill('user@test.com');
    await passwordInput.fill('1q2w3e4r1@');
    await page.getByRole('button', { name: '로그인', exact: true }).click();

    await expect(page).toHaveURL(/\/(?:onboarding\/agree-terms|qna)(?:\?.*)?$/);
    if (page.url().includes('/onboarding/agree-terms')) {
      await reviewAndAcceptTerms(page);
    }
    await expect(page).toHaveURL(/\/qna$/);
    await page.reload();
    await expect(page).toHaveURL(/\/qna$/);

    const profileMenuButton = page.getByRole('button', { name: /프로필 메뉴 열기|open profile menu/i });
    await waitForHydration(profileMenuButton);
    await profileMenuButton.click();
    await page.getByRole('menuitem', { name: /로그아웃|log out/i }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/qna');
    await expect(page).toHaveURL(/\/login/);
  });
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

  const agreeAll = page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' });
  await agreeAll.click();
  await expect(agreeAll).toBeChecked();
  const continueButton = page.getByRole('button', { name: /동의하고 계속하기/ });
  await expect(continueButton).toBeEnabled();
  const agreementResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/service-terms/agreements') && response.request().method() === 'POST');
  const agreementRefresh = page.waitForResponse((response) => response.url().endsWith('/api/v1/service-terms/agreements') && response.request().method() === 'GET');
  await continueButton.click();
  const response = await agreementResponse;
  expect(response.status(), await response.text()).toBe(200);
  const refreshed = await agreementRefresh;
  expect(refreshed.status()).toBe(200);
  const agreementItems = (await refreshed.json()).data.items as Array<{ isRequired: boolean; isAgreed: boolean }>;
  expect(agreementItems.filter((term) => term.isRequired).every((term) => term.isAgreed)).toBe(true);
}

async function waitForHydration(locator: Locator): Promise<void> {
  await expect(locator.page().locator('html')).toHaveAttribute('data-hydrated', 'true');
}
