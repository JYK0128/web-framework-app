import { expect, test } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with valid seed admin credentials and navigate to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForResponse((res) => res.url().includes('/api/v1/auth/providers'));

    // Enter email and password into the visible tab fields
    await page.locator('input[type="email"]:visible').fill('admin@test.com');
    await page.locator('input[type="password"]:visible').fill('1q2w3e4r1@');

    // Click visible submit button
    await page.locator('button[type="submit"]:visible').click();

    // Verify redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Verify session cookie was set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
  });
});
