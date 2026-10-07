import { expect, test } from '@playwright/test';

async function width(locator: import('@playwright/test').Locator): Promise<number> {
  return locator.evaluate((node) => node.getBoundingClientRect().width);
}

test('FAQ keeps the category width while the question fills remaining space', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/faq');
  await page.waitForLoadState('networkidle');
  const category = page.getByRole('columnheader', { name: /카테고리/ });
  const question = page.getByRole('columnheader', { name: /질문/ });
  await expect.poll(() => width(category)).toBeCloseTo(100, 0);
  const table = page.getByRole('table');
  expect(Math.abs(await width(table) - await width(category) - await width(question))).toBeLessThan(1);
  expect(await width(question)).toBeGreaterThan(320);
  const expand = page.getByRole('table').getByRole('button', { expanded: false }).first();
  await expand.click();
  await expect(page.getByRole('table').getByRole('button', { expanded: true })).toHaveCount(1);
  await expect.poll(() => width(category)).toBeCloseTo(100, 0);
  await page.getByRole('button', { name: '보기', exact: true }).click();
  await page.getByRole('button', { name: /질문$/ }).click();
  await expect(question).toHaveCount(0);
  await expect.poll(() => width(category)).toBeCloseTo(100, 0);
  await expect.poll(() => width(table)).toBeCloseTo(100, 0);
  await page.getByRole('button', { name: /질문$/ }).click();
  await page.getByRole('button', { name: /카테고리$/ }).click();
  await expect(category).toHaveCount(0);
  expect(await width(question)).toBeGreaterThan(320);
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect.poll(() => width(category)).toBeCloseTo(100, 0);
});

test('FAQ keeps specified widths during horizontal scrolling on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto('/faq');
  await page.waitForLoadState('networkidle');
  const category = page.getByRole('columnheader', { name: /카테고리/ });
  const question = page.getByRole('columnheader', { name: /질문/ });
  await expect.poll(() => width(category)).toBeCloseTo(100, 0);
  await expect.poll(() => width(question)).toBeCloseTo(320, 0);
  const scroller = page.getByRole('table').locator('..').locator('..');
  const before = await category.evaluate((node) => node.getBoundingClientRect().x);
  const metrics = await scroller.evaluate((node) => {
    node.scrollLeft = node.scrollWidth;
    return { width: node.clientWidth, contentWidth: node.scrollWidth, left: node.scrollLeft };
  });
  expect(metrics.contentWidth).toBeGreaterThan(metrics.width);
  expect(metrics.left).toBeGreaterThan(0);
  expect(await category.evaluate((node) => node.getBoundingClientRect().x)).toBeLessThan(before);
  await expect.poll(() => width(category)).toBeCloseTo(100, 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect.poll(() => width(question)).toBeGreaterThan(320);
  await expect.poll(() => width(category)).toBeCloseTo(100, 0);
});

test('FAQ respects column resizing, minimum width and reordered columns', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/faq');
  await page.waitForLoadState('networkidle');
  const category = page.getByRole('columnheader', { name: /카테고리/ });
  const handle = page.getByRole('separator', { name: 'category 열 크기 조절' });
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2);
  await page.mouse.up();
  await expect.poll(() => width(category)).toBeCloseTo(140, 0);
  const resized = await handle.boundingBox();
  await page.mouse.move(resized!.x + resized!.width / 2, resized!.y + resized!.height / 2);
  await page.mouse.down();
  await page.mouse.move(resized!.x - 180, resized!.y + resized!.height / 2);
  await page.mouse.up();
  await expect.poll(() => width(category)).toBeCloseTo(80, 0);
  const from = await category.boundingBox();
  const to = await page.getByRole('columnheader', { name: /질문/ }).boundingBox();
  await page.mouse.move(from!.x + 15, from!.y + 15);
  await page.mouse.down();
  await page.mouse.move(to!.x + 30, to!.y + 15);
  await page.mouse.up();
  await expect(page.getByRole('columnheader').first()).toContainText('질문');
  await expect.poll(() => width(category)).toBeCloseTo(80, 0);
});
