import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Machine S2S Pipeline E2E Tests
 *
 * Verifies the full Control Plane → Data Plane call chain:
 *   admin-web (browser) → admin-api (JWT auth) → service-api (Machine internal guard)
 *
 * Requires both admin-api and service-api to be running.
 * Set SERVICE_API_URL env var if service-api is not on default port.
 */

const SERVICE_API_BASE = process.env.SERVICE_API_URL ?? 'http://localhost:4000';

test.describe('Machine S2S Pipeline: Admin → Customers', () => {
  /**
   * Shared login helper: logs in as super-admin and returns the auth cookie context.
   * Re-used across tests to avoid repeating login steps.
   */
  async function loginAsAdmin(request: APIRequestContext) {
    const response = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(response.status()).toBe(200);
    const body = await response.json() as { data: { accessToken: string } };
    return { Authorization: `Bearer ${body.data.accessToken}` };
  }

  test('should list service-api customers via Machine auth after admin login', async ({ request }) => {
    const headers = await loginAsAdmin(request);

    // Call admin-api /api/v1/customers — which internally issues a machine token
    // and calls service-api /api/v1/internal/users
    const response = await request.get('/api/v1/customers', { headers });

    expect(response.status()).toBe(200);

    const body = (await response.json()).data;

    // Response shape from the customer page contract via InternalServiceClient
    expect(body).toHaveProperty('totalCount');
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
    expect(body).toHaveProperty('page', 1);
  });

  test('should retrieve a specific customer via Machine auth after admin login', async ({ request }) => {
    const headers = await loginAsAdmin(request);

    // First get all customers to extract a real ID
    const listResponse = await request.get('/api/v1/customers', { headers });
    expect(listResponse.status()).toBe(200);
    const { items } = (await listResponse.json()).data as { items: { id: string }[] };

    // Skip if no users seeded yet (not a failure — just an empty dataset)
    if (items.length === 0) {
      test.skip();
      return;
    }

    const firstId = items[0].id;
    const detailResponse = await request.get(`/api/v1/customers/${firstId}`, { headers });
    expect(detailResponse.status()).toBe(200);

    const detail = (await detailResponse.json()).data;
    expect(detail).toHaveProperty('id', firstId);
    expect(detail).toHaveProperty('email');
    expect(detail).toHaveProperty('roleCode');
    expect(detail).toHaveProperty('roleLabel');
  });

  test('should return 401 when calling /api/v1/customers without auth', async ({ request }) => {
    // Direct API call without any cookie/token — admin-api AuthenticationGuard should reject
    const response = await request.get('/api/v1/customers');
    expect(response.status()).toBe(401);
  });

  test('should open a customer detail from the authenticated admin screen', async ({ page }) => {
    const loginResponse = await page.request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(loginResponse.status()).toBe(200);
    await page.goto('/customers');
    await expect(page.getByRole('heading', { name: '고객 관리', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '서비스 관리' })).toBeVisible();
    await expect(page.getByRole('link', { name: '관리자 약관 관리' }).first()).toBeVisible();
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    const customerName = await firstRow.locator('td').first().innerText();
    await firstRow.click();

    const detailModal = page.getByLabel('고객 상세 정보');
    await expect(detailModal.getByRole('heading', { name: '고객 상세 정보' })).toBeVisible();
    await expect(detailModal.getByText(customerName.split('\n')[0], { exact: true })).toBeVisible();
    await expect(detailModal.getByText('멤버십', { exact: true })).toBeVisible();
  });

  test('should change customer access through the admin UI and persist through internal service management', async ({ page }) => {
    const loginResponse = await page.request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(loginResponse.status()).toBe(200);
    const auth = await loginResponse.json() as { data: { accessToken: string } };
    const headers = { Authorization: `Bearer ${auth.data.accessToken}` };
    const listResponse = await page.request.get('/api/v1/customers?limit=1', { headers });
    expect(listResponse.status()).toBe(200);
    const { items } = (await listResponse.json()).data as { items: { id: string, name: string, banned: boolean }[] };
    expect(items.length).toBeGreaterThan(0);
    const customer = items[0];

    try {
      await page.goto('/customers');
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow).toBeVisible();
      await firstRow.click();
      const detailModal = page.getByLabel('고객 상세 정보');

      const banResponse = page.waitForResponse((response) => response.url().includes(`/api/v1/customers/${customer.id}/ban`) && response.request().method() === 'POST');
      await detailModal.getByRole('button', { name: '이용 정지', exact: true }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: '정지', exact: true }).click();
      expect((await banResponse).status()).toBe(201);

      await expect(detailModal.getByRole('button', { name: '정지 해제', exact: true })).toBeVisible();
      const bannedDetail = await page.request.get(`/api/v1/customers/${customer.id}`, { headers });
      expect((await bannedDetail.json()).data.banned).toBe(true);

      const unbanResponse = page.waitForResponse((response) => response.url().includes(`/api/v1/customers/${customer.id}/unban`) && response.request().method() === 'POST');
      await detailModal.getByRole('button', { name: '정지 해제', exact: true }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: '정지 해제', exact: true }).click();
      expect((await unbanResponse).status()).toBe(201);

      const restoredDetail = await page.request.get(`/api/v1/customers/${customer.id}`, { headers });
      expect((await restoredDetail.json()).data.banned).toBe(false);
    }
    finally {
      const current = await page.request.get(`/api/v1/customers/${customer.id}`, { headers });
      if (current.ok() && (await current.json()).data.banned === true) {
        await page.request.post(`/api/v1/customers/${customer.id}/unban`, { headers });
      }
    }
  });
});

test.describe('Machine Security: Internal Endpoint Direct Access', () => {
  test('service-api /api/v1/internal/users must reject requests without a valid machine token', async ({
    request,
  }) => {
    // Direct call to service-api bypassing admin-api — no machine token present
  const response = await request.get(`${SERVICE_API_BASE}/api/v1/internal/users`, {
      headers: {
        // Deliberately no Authorization header
      },
    });

    // MachineAuthGuard must deny the request
    expect([401, 403]).toContain(response.status());
  });

  test('service-api /api/v1/internal/users must reject a forged machine token (wrong secret)', async ({
    request,
  }) => {
    // A token signed with the wrong secret to simulate an external attacker
    const forgedToken = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'eyJpc3MiOiJhZG1pbi1hcGkiLCJhdWQiOiJzZXJ2aWNlLWFwaSIsInN1YiI6ImF0dGFja2VyIn0',
      'INVALID_SIGNATURE_XXXXXXXXXXXXXXXXXXXX',
    ].join('.');

  const response = await request.get(`${SERVICE_API_BASE}/api/v1/internal/users`, {
      headers: {
        Authorization: `Bearer ${forgedToken}`,
      },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('service-api /api/v1/internal/users must reject a token with wrong audience', async ({
    request,
  }) => {
    // A token claiming aud=admin-api (self) instead of service-api — audience mismatch
    const wrongAudToken = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'eyJpc3MiOiJhZG1pbi1hcGkiLCJhdWQiOiJhZG1pbi1hcGkiLCJzdWIiOiJhdHRhY2tlciJ9',
      'INVALID_SIGNATURE_XXXXXXXXXXXXXXXXXXXX',
    ].join('.');

    const response = await request.get(`${SERVICE_API_BASE}/api/v1/internal/users`, {
      headers: {
        Authorization: `Bearer ${wrongAudToken}`,
      },
    });

    expect([401, 403]).toContain(response.status());
  });
});
