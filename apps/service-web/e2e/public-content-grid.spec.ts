import { expect, test } from '@playwright/test';

for (const resource of ['events', 'notices'] as const) {
  test(`${resource} grid loads cursor batches on scroll and expands content`, async ({ page }) => {
    const requests: URL[] = [];
    const now = Date.now();
    const items = Array.from({ length: 45 }, (_, index) => ({
      id: `content-${index}`,
      title: `검증 항목 ${index}`,
      content: `검증 본문 ${index}`,
      status: 'published',
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      publishedAt: new Date(now).toISOString(),
      importance: 'normal',
      isPinned: index === 0,
      startsAt: new Date(now - 86400000 * 2).toISOString(),
      endsAt: new Date(now + (index < 40 ? 86400000 : -86400000)).toISOString(),
      imageUrl: null,
      linkUrl: null,
    }));
    await page.route(`**/api/v1/${resource}?*`, async (route) => {
      const url = new URL(route.request().url());
      requests.push(url);
      const filtered = items.filter((item, index) => (
        (!url.searchParams.get('search') || item.title.includes(url.searchParams.get('search')!))
        && (url.searchParams.get('phase') !== 'ended' || index >= 40)
      ));
      const start = Number(url.searchParams.get('cursor') ?? 0);
      const batch = filtered.slice(start, start + 20);
      await route.fulfill({ json: {
        success: true,
        data: {
          items: batch,
          startCursor: String(start),
          endCursor: String(start + batch.length),
          hasNextPage: start + batch.length < filtered.length,
          hasPrevPage: start > 0,
          totalCount: filtered.length,
        },
      } });
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/${resource}`);
    await expect(page.getByRole('button', { name: '검증 항목 0', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '더 보기', exact: true })).toHaveCount(0);
    const scroller = page.getByRole('table').locator('..').locator('..');
    const initialHeight = await scroller.evaluate((element) => element.scrollHeight);
    await scroller.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => requests.some((url) => url.searchParams.get('cursor') === '20')).toBe(true);
    await expect.poll(() => scroller.evaluate((element) => element.scrollHeight)).toBeGreaterThan(initialHeight);
    await scroller.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => requests.some((url) => url.searchParams.get('cursor') === '40')).toBe(true);
    await expect.poll(() => scroller.evaluate((element) => element.scrollHeight)).toBeGreaterThan(initialHeight * 2 - 40);
    await scroller.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await page.getByRole('button', { name: '검증 항목 44', exact: true }).click();
    await expect(page.getByText('검증 본문 44', { exact: true })).toBeVisible();
    expect(requests.filter((url) => url.searchParams.has('cursor'))).toHaveLength(2);

    await scroller.evaluate((element) => { element.scrollTop = 0; });
    await expect(page.getByRole('button', { name: '검증 항목 0', exact: true })).toBeVisible();
    if (resource === 'events') {
      await page.getByRole('button', { name: '종료', exact: true }).click();
      await expect(page.getByRole('button', { name: '검증 항목 40', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '검증 항목 0', exact: true })).toHaveCount(0);
      expect(requests.at(-1)?.searchParams.get('phase')).toBe('ended');
      expect(requests.at(-1)?.searchParams.has('cursor')).toBe(false);
    }
    await page.getByPlaceholder('제목 또는 내용 검색').fill('검증 항목 44');
    await expect(page.getByRole('button', { name: '검증 항목 44', exact: true })).toBeVisible();
    await expect.poll(() => requests.at(-1)?.searchParams.get('search')).toBe('검증 항목 44');
    expect(requests.at(-1)?.searchParams.has('cursor')).toBe(false);
    const wideWidths = await page.getByRole('columnheader').evaluateAll((headers) => headers.map((header) => header.getBoundingClientRect().width));
    expect(wideWidths[0]).toBeGreaterThanOrEqual(80);
    expect(wideWidths[2]).toBeGreaterThanOrEqual(280);
    await page.setViewportSize({ width: 390, height: 720 });
    await expect.poll(() => scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await scroller.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: '검증 항목 44', exact: true })).toBeVisible();

  });
}
