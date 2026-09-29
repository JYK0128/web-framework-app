import { expect, test } from '@playwright/test';

type CreateResponse = { data: { id: string } };
type OperatorResponse = { data: { id: string, roleCode: string } };
type RoleResponse = { data: { id: string } };
type LoginResponse = { data: { accessToken: string } };

test('changes an operator to a dynamically created role through the admin UI', async ({ page }) => {
  const loginResponse = await page.request.post('/api/v1/auth/login', {
    data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const accessToken = (await loginResponse.json() as LoginResponse).data.accessToken;
  const requestOptions = { headers: { Authorization: `Bearer ${accessToken}` } };

  const suffix = Date.now();
  const roleCode = `e2e_operator_role_${suffix}`;
  const email = `e2e-operator-${suffix}@example.com`;
  let operatorId: string | undefined;
  let roleId: string | undefined;

  try {
    const roleResponse = await page.request.post('/api/v1/roles', {
      data: {
        code: roleCode,
        label: 'E2E 운영자 역할',
        description: '운영자 동적 역할 변경 테스트용 역할',
        permissions: ['operator:read'],
      },
      ...requestOptions,
    });
    expect(roleResponse.status()).toBe(201);
    roleId = (await roleResponse.json() as RoleResponse).data.id;

    const userResponse = await page.request.post('/api/v1/operators', {
      data: {
        name: 'E2E 운영자',
        email,
        password: '1q2w3e4r1@',
        role: 'admin',
      },
      ...requestOptions,
    });
    expect(userResponse.status()).toBe(201);
    operatorId = (await userResponse.json() as CreateResponse).data.id;

    await expect.poll(async () => {
      const response = await page.request.get('/api/v1/operators?search=E2E%20%EC%9A%B4%EC%98%81%EC%9E%90', requestOptions);
      if (!response.ok()) return false;
      const items = (await response.json() as { data: { items: Array<{ name: string }> } }).data.items;
      return items.some((item) => item.name === 'E*****자');
    }).toBe(true);

    await page.goto('/operator-management');
    await page.waitForLoadState('networkidle');
    const search = page.getByPlaceholder('이름 또는 이메일 검색...');
    await search.fill('E2E 운영자');
    await page.waitForTimeout(500);
    const row = page.getByRole('row').filter({ hasText: 'E*****자' });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: '도구' }).click();
    await page.getByRole('menuitem', { name: '역할 변경' }).click();

    const dialog = page.getByRole('dialog');
    const roleSelect = dialog.getByRole('combobox');
    await roleSelect.click();
    await page.getByRole('option', { name: new RegExp(roleCode) }).click();
    await expect(roleSelect).toContainText('E2E 운영자 역할');
    await dialog.getByRole('button', { name: '저장' }).click();

    await expect.poll(async () => {
      const response = await page.request.get(`/api/v1/operators/${operatorId}`, requestOptions);
      expect(response.ok()).toBeTruthy();
      return (await response.json() as OperatorResponse).data.roleCode;
    }).toBe(roleCode);
  }
  finally {
    if (operatorId) await page.request.delete(`/api/v1/operators/${operatorId}`, requestOptions);
    if (roleId) await page.request.delete(`/api/v1/roles/${roleId}`, requestOptions);
  }
});
