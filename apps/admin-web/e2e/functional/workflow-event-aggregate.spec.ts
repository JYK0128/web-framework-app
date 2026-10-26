import { expect, test } from '@playwright/test';

test('admin-created published event appears in public aggregate results', async ({ page }) => {
  await signInAdmin(page);

  const title = `E2E aggregate ${Date.now()}`;
  const now = Date.now();
  const startsAt = new Date(now - 60 * 60 * 1000);
  const endsAt = new Date(now + 60 * 60 * 1000);
  const publishedAt = new Date(now - 60 * 1000);
  const adminWebUrl = process.env.ADMIN_WEB_URL;
  const serviceApiUrl = process.env.SERVICE_API_URL;
  if (!adminWebUrl || !serviceApiUrl) throw new Error('E2E URLs are required');

  const api = page.context().request;
  let eventId: string | undefined;
  try {
    const createResponse = await api.post(`${adminWebUrl}/api/v1/events`, {
      headers: { origin: adminWebUrl },
      data: {
        title,
        content: '<p>Aggregate E2E event</p>',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        publishedAt: publishedAt.toISOString(),
      },
    });
    expect(createResponse.status()).toBe(201);
    eventId = (await createResponse.json() as { id: string }).id;

    const aggregateUrl = new URL('/api/v1/events/summary', serviceApiUrl);
    aggregateUrl.searchParams.set('groupBy', 'phaseOrder');
    aggregateUrl.searchParams.set('search', title);
    aggregateUrl.searchParams.set('filters[startsAt][gte]', new Date(startsAt.getTime() - 60_000).toISOString());
    aggregateUrl.searchParams.set('filters[endsAt][lte]', new Date(endsAt.getTime() + 60_000).toISOString());
    aggregateUrl.searchParams.set('sort', 'eventCount');
    aggregateUrl.searchParams.set('direction', 'desc');
    aggregateUrl.searchParams.set('take', '10');

    const aggregateResponse = await api.get(aggregateUrl.toString());
    expect(aggregateResponse.status()).toBe(200);
    expect(await aggregateResponse.json()).toMatchObject({
      data: {
        items: [{ phase: 'ongoing', eventCount: 1 }],
      },
    });

    aggregateUrl.searchParams.set('sort', 'title');
    const invalidSortResponse = await api.get(aggregateUrl.toString());
    expect(invalidSortResponse.status()).toBe(400);
  }
  finally {
    if (eventId) {
      const deleteResponse = await api.delete(`${adminWebUrl}/api/v1/events/${eventId}`, {
        headers: { origin: adminWebUrl },
      });
      expect(deleteResponse.ok()).toBeTruthy();
    }
  }
});

async function signInAdmin(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await page.getByLabel('이메일').fill('admin@test.com');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('1q2w3e4r1@');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  if (await page.getByRole('heading', { name: /약관/ }).isVisible().catch(() => false)) {
    await page.getByRole('checkbox', { name: '전체 약관에 동의합니다.' }).click();
    await page.getByRole('button', { name: /동의하고 계속하기/ }).click();
  }
}
