import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './support/auth';

test('FAQ management completes create, edit, and delete through the browser UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/faq-management');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1', { hasText: 'FAQ management' })).toBeVisible();

  const question = `UI FAQ ${Date.now()}`;
  await page.getByRole('button', { name: 'Add FAQ' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Question').fill(question);
  await dialog.getByLabel('Answer').fill('Created through the browser UI.');
  await dialog.getByRole('button', { name: 'Save' }).click();

  const row = page.getByRole('row').filter({ hasText: question });
  await expect(row).toBeVisible();
  await row.click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  const updatedQuestion = `${question} updated`;
  await editDialog.getByLabel('Question').fill(updatedQuestion);
  await editDialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('row').filter({ hasText: updatedQuestion })).toBeVisible();

  const updatedRow = page.getByRole('row').filter({ hasText: updatedQuestion });
  await updatedRow.getByRole('button').last().click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(updatedRow).toHaveCount(0);
});

test('notice management completes create, edit, and delete through the browser UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/notice-management');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1', { hasText: 'Notices' })).toBeVisible();

  const title = `UI 공지 ${Date.now()}`;
  await page.getByRole('button', { name: 'Write New Notice' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Content').fill('Created through the browser UI.');
  await dialog.getByRole('button', { name: 'Save' }).click();

  const row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toBeVisible();
  await row.click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  const updatedTitle = `${title} updated`;
  await editDialog.getByLabel('Title').fill(updatedTitle);
  await editDialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('row').filter({ hasText: updatedTitle })).toBeVisible();

  const updatedRow = page.getByRole('row').filter({ hasText: updatedTitle });
  await updatedRow.getByRole('button').last().click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(updatedRow).toHaveCount(0);
});

test('FAQ feed opens the created item detail through the browser UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/faq-management');
  await page.waitForLoadState('networkidle');

  const question = `UI FAQ detail ${Date.now()}`;
  await page.getByRole('button', { name: 'Add FAQ' }).click();
  const createDialog = page.getByRole('dialog');
  await createDialog.getByLabel('Question').fill(question);
  await createDialog.getByLabel('Answer').fill('Detail answer from the UI test.');
  await createDialog.getByRole('button', { name: 'Save' }).click();

  await page.goto('/faq');
  await page.waitForLoadState('networkidle');
  const search = page.getByPlaceholder('Search questions or answers...');
  await search.fill(question);
  await page.waitForTimeout(500);
  const item = page.getByText(question, { exact: true });
  await expect(item).toBeVisible();
  await item.click();
  await expect(page.getByText('Detail answer from the UI test.', { exact: true })).toBeVisible();

  await page.goto('/faq-management');
  await page.waitForLoadState('networkidle');
  const row = page.getByRole('row').filter({ hasText: question });
  await expect(row).toBeVisible();
  await row.getByRole('button').last().click();
  const confirm = page.getByRole('alertdialog');
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(row).toHaveCount(0);
});
