import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { expect, test } from '@playwright/test';

test('customer creates a support room, sends a message, and closes the conversation', async ({ page }) => {
  test.skip(!SERVICE_AUTH_POLICY_CONFIG.credentialAvailable, 'Service credential login is disabled by policy.');
  await page.goto('/login');
  const email = page.getByLabel('이메일');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await email.fill('user@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  if (page.url().includes('/onboarding/agree-terms')) {
    const detailsButtons = page.getByRole('button', { name: /내용 보기$/ });
    await expect(detailsButtons.first()).toBeVisible();
    await waitForHydration(detailsButtons.first());
    for (let index = 0; index < await detailsButtons.count(); index++) {
      await detailsButtons.nth(index).click();
      const detail = page.getByRole('dialog');
      await expect(detail.getByRole('heading')).toBeVisible();
      await detail.getByRole('button', { name: '닫기' }).click();
    }
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }

  await page.goto('/support');
  const message = `브라우저 상담 테스트 ${Date.now()}`;
  const startButton = page.getByRole('button', { name: '새 상담 시작' });
  await waitForHydration(startButton);
  await startButton.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('새 상담')).toBeVisible();
  const messageInput = dialog.getByLabel('메시지');
  await waitForHydration(messageInput);
  await messageInput.fill(message);
  const sendButton = dialog.getByRole('button', { name: '전송' });
  await waitForHydration(sendButton);
  await messageInput.press('Tab');
  await sendButton.click();
  await expect(dialog.locator('p').filter({ hasText: message })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '상담 종료' })).toBeVisible();
  await dialog.getByRole('button', { name: '상담 종료' }).click();
  await expect(dialog.getByText('종료된 상담')).toBeVisible();
  await expect(dialog.getByLabel('메시지')).toBeDisabled();
  await dialog.getByRole('button', { name: /닫기|Close/i }).click();

  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: message })).toBeVisible();
});

async function waitForHydration(locator: import('@playwright/test').Locator): Promise<void> {
  await expect(locator.page().locator('html')).toHaveAttribute('data-hydrated', 'true');
}
