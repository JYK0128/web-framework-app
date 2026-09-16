import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './support/auth';

test('support tickets create, view details, close, and delete through the user UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/support');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1', { hasText: /Support|고객 지원/i })).toBeVisible();

  // 1. Create a support ticket
  await page.getByRole('button', { name: /New request|New ticket|지원 요청|티켓 등록/i }).click();
  const createDialog = page.getByRole('dialog');
  await expect(createDialog).toBeVisible();

  const title = `UI Support Ticket ${Date.now()}`;
  await createDialog.getByLabel(/Title|제목/i).fill(title);
  await createDialog.getByLabel(/Description|Content|내용/i).fill('This is a test support ticket submitted via E2E test.');
  await createDialog.getByRole('button', { name: /Save|저장/i }).click();

  // 2. Verify ticket appears in the data grid
  const row = page.getByRole('row').filter({ hasText: title });
  await expect(row).toBeVisible();

  // 3. Open ticket details dialog
  await row.click();
  const detailDialog = page.getByRole('dialog');
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog).toContainText(title);
  await expect(detailDialog).toContainText('This is a test support ticket submitted via E2E test.');

  // 4. Close ticket from detail dialog
  await detailDialog.getByRole('button', { name: /Mark as resolved|Close ticket|해결 완료|티켓 종료/i }).click();
  await expect(detailDialog).toBeHidden();

  // 5. Verify status tab switching (Closed tab)
  await page.getByRole('tab', { name: /Closed|종료/i }).click();
  await expect(page.getByRole('tab', { name: /Closed|종료/i })).toHaveAttribute('aria-selected', 'true');
  const closedRow = page.getByRole('row').filter({ hasText: title });
  await expect(closedRow).toBeVisible();

  // Switch back to All tab
  await page.getByRole('tab', { name: /All|전체/i }).click();
  await expect(page.getByRole('tab', { name: /All|전체/i })).toHaveAttribute('aria-selected', 'true');
});

test('support management filters by status, handles ticket, and deletes through the admin UI', async ({ page }) => {
  await loginAsAdmin(page);

  // 1. Create a ticket first to manage
  await page.goto('/support');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /New request|New ticket|지원 요청|티켓 등록/i }).click();
  const createDialog = page.getByRole('dialog');
  const manageTitle = `UI Manage Ticket ${Date.now()}`;
  await createDialog.getByLabel(/Title|제목/i).fill(manageTitle);
  await createDialog.getByLabel(/Description|Content|내용/i).fill('Support ticket for management testing.');
  await createDialog.getByRole('button', { name: /Save|저장/i }).click();
  await expect(page.getByRole('row').filter({ hasText: manageTitle })).toBeVisible();

  // 2. Navigate to support management
  await page.goto('/support-management');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1', { hasText: /Support Management|고객 지원 관리/i })).toBeVisible();

  // Test status tabs
  await page.getByRole('tab', { name: /Open|접수/i }).click();
  await expect(page.getByRole('tab', { name: /Open|접수/i })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('row').filter({ hasText: manageTitle })).toBeVisible();

  // 3. Open management dialog
  const row = page.getByRole('row').filter({ hasText: manageTitle });
  await row.click();
  const manageDialog = page.getByRole('dialog');
  await expect(manageDialog).toBeVisible();

  // 4. Update resolution and save
  await manageDialog.getByLabel(/Resolution|답변 및 처리 내용/i).fill('Resolution has been provided by the support team.');
  await manageDialog.getByRole('button', { name: /Save|저장/i }).click();
  await expect(manageDialog).toBeHidden();

  // 5. Delete ticket from support management
  const updatedRow = page.getByRole('row').filter({ hasText: manageTitle });
  await updatedRow.getByRole('button').last().click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: /Confirm|Delete request|Delete ticket|삭제|확인/i }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: manageTitle })).toHaveCount(0);
});
