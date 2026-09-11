import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './support/auth';

const protectedScreens = [
  ['/dashboard', 'Dashboard'],
  ['/notice', 'Announcements'],
  ['/faq', 'FAQ'],
  ['/inquiry', 'Inquiries'],
  ['/profile', 'Profile'],
  ['/user-management', 'User management'],
  ['/permission-management', 'Permissions'],
  ['/notice-management', 'Notices'],
  ['/faq-management', 'FAQ management'],
  ['/inquiry-management', 'Inquiry Management'],
  ['/terms-management', 'Terms'],
  ['/system-management', 'System Configuration'],
] as const;

for (const [path, title] of protectedScreens) {
  test(`renders ${title} through the browser route`, async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(title);
  });
}
