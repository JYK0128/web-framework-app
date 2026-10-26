import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { expect, test } from '@playwright/test';

test('registration rejects a mismatched password confirmation in the browser', async ({ page }) => {
  await page.goto('/register');
  if (!SERVICE_AUTH_POLICY_CONFIG.registrationAvailable || !SERVICE_AUTH_POLICY_CONFIG.credentialAvailable) {
    await expect(page.getByRole('status')).toHaveText('현재 회원가입을 사용할 수 없습니다.');
    return;
  }

  const name = page.getByLabel('이름');
  await waitForHydration(name);
  await name.fill('E2E Browser User');
  await page.getByLabel('이메일').fill(`e2e-${Date.now()}@example.test`);
  const password = `A1!${'x'.repeat(Math.max(1, SERVICE_AUTH_POLICY_CONFIG.passwordMinLength - 3))}`;
  const passwordInput = page.getByRole('textbox', { name: '비밀번호', exact: true });
  await passwordInput.fill(password);
  const confirmation = page.getByLabel('비밀번호 확인');
  await confirmation.fill(`${password}different`);
  await page.getByRole('button', { name: '회원가입' }).click();
  await expect(confirmation).toHaveAttribute('aria-invalid', 'true');
});

test('account recovery switches tabs and rejects incomplete lookup details', async ({ page }) => {
  await page.goto('/find-account');
  await expect(page.getByRole('heading', { name: '아이디·비밀번호 찾기' })).toBeVisible();
  const passwordTab = page.getByRole('tab', { name: '비밀번호 재설정' });
  await waitForHydration(passwordTab);
  await passwordTab.click();
  await expect(page.getByLabel('이메일')).toBeVisible();
  await expect(page.getByLabel('전화번호')).toBeVisible();
  await page.getByRole('button', { name: '비밀번호 재설정 링크 받기' }).click();
  await expect(page.getByLabel('이메일')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('전화번호')).toHaveAttribute('aria-invalid', 'true');

  await page.goto('/reset-password');
  await expect(page.getByRole('alert')).toContainText('재설정 링크에 필요한 정보가 없습니다.');
  await expect(page.getByRole('button', { name: '비밀번호 변경' })).toBeDisabled();
});

async function waitForHydration(locator: import('@playwright/test').Locator): Promise<void> {
  await expect(locator.page().locator('html')).toHaveAttribute('data-hydrated', 'true');
}
