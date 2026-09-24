import { expect, test } from '@playwright/test';

type ApiResponse<T> = { data: T };
type LoginResponse = { data: { accessToken: string } };

test('manages customer memberships through the dedicated service role API', async ({ page }) => {
  const loginResponse = await page.request.post('/api/v1/auth/login', {
    data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const accessToken = (await loginResponse.json() as LoginResponse).data.accessToken;
  const requestOptions = { headers: { Authorization: `Bearer ${accessToken}` } };

  const suffix = Date.now();
  const code = `e2e_membership_${suffix}`;
  const label = 'E2E 멤버십';
  let membershipId: string | undefined;

  try {
    await page.goto('/membership-management');
    await expect(page.getByRole('heading', { name: '멤버십 관리', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: '멤버십 추가' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('멤버십 코드').fill(code);
    await dialog.getByLabel('멤버십 이름').fill(label);
    await dialog.locator('label').filter({ hasText: 'feature:premium' }).getByRole('checkbox').check();
    await dialog.getByRole('button', { name: '저장' }).click();

    const membershipButton = page.getByRole('button', { name: new RegExp(`${label}.*${code}`) });
    await expect(membershipButton).toBeVisible();
    await membershipButton.click();
    await expect(page.getByText('적용 고객')).toBeVisible();

    await page.getByRole('button', { name: '수정', exact: true }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('멤버십 이름').fill(`${label} 수정`);
    await editDialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(`${label} 수정`, { exact: true })).toBeVisible();

    const response = await page.request.get('/api/v1/memberships', requestOptions);
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as ApiResponse<{ items: Array<{ id: string, code: string, permissions: string[] }> }>;
    const createdMembership = body.data.items.find((item) => item.code === code);
    membershipId = createdMembership?.id;
    expect(membershipId).toBeTruthy();
    expect(createdMembership?.permissions).toContain('feature:premium');
  }
  finally {
    if (!membershipId) {
      const response = await page.request.get('/api/v1/memberships', requestOptions);
      if (response.ok()) {
        const body = await response.json() as ApiResponse<{ items: Array<{ id: string, code: string }> }>;
        membershipId = body.data.items.find((item) => item.code === code)?.id;
      }
    }
    if (membershipId) {
      const response = await page.request.delete(`/api/v1/memberships/${membershipId}`, requestOptions);
      expect(response.ok()).toBeTruthy();
    }
  }
});
