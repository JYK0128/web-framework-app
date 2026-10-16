import { expect, test } from '@playwright/test';

test('mobile navigation opens, navigates, and closes after the selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menuButton = page.getByRole('button', { name: /open menu/i });
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('link', { name: 'Notices', exact: true }).click();
  await expect(page).toHaveURL(/\/notices$/);
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('main').getByText('공지사항', { exact: false }).first()).toBeVisible();
});
