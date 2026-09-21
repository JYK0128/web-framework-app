import { expect, test } from '@playwright/test';

type CreateResponse = { data: { id: string } };
type UserResponse = { data: { id: string, roleCode: string } };
type RoleResponse = { data: { id: string } };
type LoginResponse = { data: { accessToken: string } };

test('changes a user to a dynamically created role through the admin UI', async ({ page }) => {
  const loginResponse = await page.request.post('/api/v1/auth/login', {
    data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const accessToken = (await loginResponse.json() as LoginResponse).data.accessToken;
  const requestOptions = { headers: { Authorization: `Bearer ${accessToken}` } };

  const suffix = Date.now();
  const roleCode = `e2e_user_role_${suffix}`;
  const email = `e2e-user-${suffix}@example.com`;
  let userId: string | undefined;
  let roleId: string | undefined;

  try {
    const roleResponse = await page.request.post('/api/v1/roles', {
      data: {
        code: roleCode,
        label: 'E2E 사용자 역할',
        description: '사용자 동적 역할 변경 테스트용 역할',
        permissions: ['user:read'],
      },
      ...requestOptions,
    });
    expect(roleResponse.status()).toBe(201);
    roleId = (await roleResponse.json() as RoleResponse).data.id;

    const userResponse = await page.request.post('/api/v1/users', {
      data: {
        name: 'E2E 사용자',
        email,
        password: '1q2w3e4r1@',
        role: 'admin',
      },
      ...requestOptions,
    });
    expect(userResponse.status()).toBe(201);
    userId = (await userResponse.json() as CreateResponse).data.id;

    await page.goto('/admin-management');
    const search = page.getByPlaceholder('이름 또는 이메일 검색...');
    await search.fill(email);
    const row = page.getByRole('row').filter({ hasText: email });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: '관리 작업' }).click();
    await page.getByRole('menuitem', { name: '역할 변경' }).click();

    const dialog = page.getByRole('dialog');
    const roleSelect = dialog.getByRole('combobox');
    await roleSelect.click();
    await page.getByRole('option', { name: new RegExp(roleCode) }).click();
    await expect(roleSelect).toContainText('E2E 사용자 역할');
    await dialog.getByRole('button', { name: '저장' }).click();

    await expect.poll(async () => {
      const response = await page.request.get(`/api/v1/users/${userId}`, requestOptions);
      expect(response.ok()).toBeTruthy();
      return (await response.json() as UserResponse).data.roleCode;
    }).toBe(roleCode);
  }
  finally {
    if (userId) await page.request.delete(`/api/v1/users/${userId}`, requestOptions);
    if (roleId) await page.request.delete(`/api/v1/roles/${roleId}`, requestOptions);
  }
});
