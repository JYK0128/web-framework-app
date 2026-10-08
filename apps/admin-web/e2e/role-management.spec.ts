import { expect, test } from '@playwright/test';

test.describe('Role management UI', () => {
  test('creates a role with selected permissions and shows the saved result', async ({ page }) => {
    const loginResponse = await page.request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const roleCode = `e2e_role_${Date.now()}`;
    const roleLabel = 'E2E 권한 역할';

    await page.goto('/roles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '역할 관리', level: 1 })).toBeVisible();
    await expect(page.getByText('역할 목록', { exact: true })).toBeVisible();

    try {
      await page.getByRole('button', { name: '역할 추가' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByLabel('역할 코드').fill(roleCode);
      await dialog.getByLabel('역할 이름').fill(roleLabel);

    const userRead = dialog.locator('label').filter({ hasText: 'operator:read' }).getByRole('checkbox');
      await expect(userRead).toBeVisible();
      await userRead.check();
      await expect(dialog.getByText(/선택\s*1개/)).toBeVisible();
      await dialog.getByRole('button', { name: '저장' }).click();

      const roleButton = page.getByRole('button', { name: new RegExp(`${roleLabel}.*${roleCode}`) });
      await expect(roleButton).toBeVisible();
      await roleButton.click();
      await expect(page.getByText('operator:read', { exact: true })).toBeVisible();
      await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
      const savedRoles = await page.request.get('/api/v1/roles');
      expect(savedRoles.status()).toBe(200);
      const role = ((await savedRoles.json()).data.items as Array<{ id: string; code: string; label: string; permissions: string[] }>).find((item) => item.code === roleCode);
      expect(role).toMatchObject({ code: roleCode, label: roleLabel });
      expect(role?.permissions).toContain('operator:read');
    }
    finally {
      const rolesResponse = await page.request.get('/api/v1/roles');
      if (rolesResponse.ok()) {
        const rolesBody = await rolesResponse.json() as { data: { items: Array<{ id: string, code: string }> } };
        const createdRole = rolesBody.data.items.find((role) => role.code === roleCode);
        if (createdRole) {
          const deleted = await page.request.delete(`/api/v1/roles/${createdRole.id}`);
          expect(deleted.ok()).toBeTruthy();
        }
      }
    }
  });
});
