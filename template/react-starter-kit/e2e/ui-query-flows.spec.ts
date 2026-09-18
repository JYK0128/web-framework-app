import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './support/auth';

test('FAQ list supports search, category filtering, sorting, and reset through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/faq-management');
  await page.waitForLoadState('networkidle');

  const search = page.getByPlaceholder('Search questions or answers...');
  await search.fill('이메일');
  await page.waitForTimeout(500);
  await expect(page.getByRole('row').filter({ hasText: '이메일' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Account / Auth' }).click();
  await expect(page.getByRole('button', { name: 'Account / Auth' })).toHaveClass(/bg-primary/);

  const questionHeader = page.getByRole('columnheader', { name: /Question/ });
  await questionHeader.click();
  await expect(questionHeader).toBeVisible();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('button', { name: 'All' })).toHaveClass(/bg-primary/);

  const pageSize = page.getByRole('combobox').last();
  await pageSize.click();
  await page.getByRole('option', { name: '5' }).click();
  await expect(page.getByText(/Rows per page/)).toBeVisible();
});

test('notice and inquiry lists expose search, filter tabs, and reset actions through the UI', async ({ page }) => {
  await loginAsAdmin(page);

  await page.goto('/notice-management');
  await page.waitForLoadState('networkidle');
  const noticeSearch = page.getByPlaceholder('Search notice titles...');
  await noticeSearch.fill('not-found');
  await page.waitForTimeout(500);
  await expect(page.getByText('No results found.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(noticeSearch).toHaveValue('');

  await page.goto('/inquiry-management');
  await page.waitForLoadState('networkidle');
  const inquirySearch = page.getByPlaceholder(/Search/i);
  await inquirySearch.fill('not-found');
  await page.waitForTimeout(500);
  await expect(page.getByText('No results found.')).toBeVisible();
  await page.getByRole('tab', { name: 'Pending' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(inquirySearch).toHaveValue('');
});
