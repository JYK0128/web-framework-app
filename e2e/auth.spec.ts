import { expect, test } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/React Starter Kit/);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid seed admin credentials and navigate to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Enter email and password into the visible tab fields
    await page.locator('input[type="email"]:visible').fill('admin@test.com');
    await page.locator('input[type="password"]:visible').fill('1q2w3e41@');

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

