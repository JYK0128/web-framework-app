import { expect, test } from '@playwright/test';

import { loginAsAdmin } from './support/auth';

test('permission management opens and closes the role editor through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/permission-management');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '역할 추가' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
});

test('permission management creates, edits, and deletes a resource through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/permission-management');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '리소스 추가' }).click();
  const dialog = page.getByRole('dialog');
  const key = `ui-${Date.now()}`;
  await dialog.getByLabel('리소스 코드 (Key)').fill(key);
  await dialog.getByLabel('리소스 이름').fill('UI Test Resource');
  const actions = dialog.getByRole('combobox').last();
  await actions.click();
  await page.getByRole('option', { name: 'read' }).click();
  await page.getByRole('option', { name: 'update' }).click();
  await page.keyboard.press('Escape');
  await dialog.getByRole('button', { name: '리소스 생성' }).click();
  await expect(page.getByText(`UI Test Resource (${key})`)).toBeVisible();

  const card = page.getByText(`UI Test Resource (${key})`).locator('xpath=ancestor::div[.//button[normalize-space()="수정"]][1]');
  await card.getByRole('button', { name: '수정' }).click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('리소스 이름').fill('UI Test Resource Updated');
  await editDialog.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText(`UI Test Resource Updated (${key})`)).toBeVisible();

  const updatedCard = page.getByText(`UI Test Resource Updated (${key})`).locator('xpath=ancestor::div[.//button[normalize-space()="수정"]][1]');
  await updatedCard.getByRole('button', { name: '삭제' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: /Confirm|Delete Template/ }).click();
  await expect(page.getByText(`UI Test Resource Updated (${key})`)).toHaveCount(0);
});

test('permission management creates, edits, and deletes a role through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/permission-management');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '역할 추가' }).click();
  const dialog = page.getByRole('dialog');
  const key = `ui-role-${Date.now()}`;
  await dialog.getByLabel('역할 식별 코드 (Key)').fill(key);
  await dialog.getByLabel('역할 이름 (Label)').fill('UI Test Role');
  await dialog.getByRole('button', { name: '역할 생성' }).click();
  await expect(page.getByText(`UI Test Role (${key})`)).toBeVisible();

  const roleCard = page.getByText(key, { exact: true }).locator('xpath=ancestor::div[contains(@class, "group")][1]');
  await roleCard.click();
  await roleCard.getByTitle('역할 수정').click();
  const editDialog = page.getByRole('dialog');
  await editDialog.getByLabel('역할 이름').fill('UI Test Role Updated');
  await editDialog.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText(`UI Test Role Updated (${key})`)).toBeVisible();

  const updatedRoleCard = page.getByText(key, { exact: true }).locator('xpath=ancestor::div[contains(@class, "group")][1]');
  await updatedRoleCard.getByTitle('역할 삭제').click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(`UI Test Role Updated (${key})`)).toHaveCount(0);
});

test('terms management opens and cancels the terms-group editor through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/terms-management');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Add New Terms Group' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
});

test('terms management creates, edits, and deletes a terms group through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/terms-management');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Add New Terms Group' }).click();
  let dialog = page.getByRole('dialog');
  const code = `ui-${Date.now()}`;
  await dialog.getByLabel('Group name').fill('UI Test Terms');
  await dialog.getByLabel('Group code').fill(code);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(`UI Test Terms (${code})`)).toBeVisible();

  await page.getByRole('button', { name: 'Edit group' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Group name').fill('UI Test Terms Updated');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(`UI Test Terms Updated (${code})`)).toBeVisible();

  await page.getByRole('button', { name: 'Delete group' }).click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(`UI Test Terms Updated (${code})`)).toHaveCount(0);
});

test('message templates creates, edits, and deletes a template through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/message-management');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Create' }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const code = `UI_TEMPLATE_${Date.now()}`;
  const name = `UI Test Template ${Date.now()}`;
  const preset = dialog.locator('select').first();
  await preset.selectOption('__custom__');
  await dialog.getByLabel(/Code|코드/).fill(code);
  await dialog.getByLabel(/Name|명칭|이름/).fill(name);
  await dialog.locator('textarea').first().fill('UI template body {{name}}');
  await dialog.getByRole('button', { name: /Create|생성/ }).click();
  const search = page.getByPlaceholder(/Search template code or description/i);
  await search.fill(code);
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const row = page.getByText(name, { exact: true }).locator('xpath=ancestor::tr[1]');
  await row.getByRole('button', { name: /Edit|수정/ }).click();
  dialog = page.getByRole('dialog');
  const updatedName = `${name} Updated`;
  await dialog.getByLabel(/Name|명칭|이름/).fill(updatedName);
  await dialog.getByRole('button', { name: /Save|저장/ }).click();
  await expect(page.getByText(updatedName, { exact: true })).toBeVisible();

  const updatedRow = page.getByText(updatedName, { exact: true }).locator('xpath=ancestor::tr[1]');
  await updatedRow.getByTitle('Delete').click();
  const confirm = page.getByRole('alertdialog');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: /Confirm|Delete Template/ }).click();
  await expect(page.getByText(updatedName, { exact: true })).toHaveCount(0);
});

test('terms management creates, views, edits, and deletes a draft term through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/terms-management');
  await page.waitForLoadState('networkidle');
  const group = page.getByRole('combobox').first();
  await expect(group).toBeVisible();
  await page.getByRole('button', { name: /Create terms version/ }).click();
  let dialog = page.getByRole('dialog');
  const version = `ui-${Date.now()}`;
  await dialog.getByLabel(/Version|버전/).fill(version);
  await dialog.getByLabel(/Terms content|Content|내용/).fill('UI test terms content');
  await dialog.getByRole('button', { name: /Save|저장/ }).click();
  await expect(page.getByText(version, { exact: true })).toBeVisible();

  const row = page.getByText(version, { exact: true }).locator('xpath=ancestor::tr[1]');
  await row.getByTitle('Edit').click();
  dialog = page.getByRole('dialog').filter({ hasText: /Edit terms version|약관 버전 수정/ });
  await dialog.locator('textarea').fill('UI test terms content updated');
  await dialog.getByRole('button', { name: /Save|저장/ }).click();
  await expect(dialog).toHaveCount(0);
  const updatedRow = page.getByText(version, { exact: true }).locator('xpath=ancestor::tr[1]');
  await updatedRow.getByTitle('Delete').click();
  const confirm = page.getByRole('alertdialog');
  await confirm.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(version, { exact: true })).toHaveCount(0);
});

test('system management reloads settings through the visible action', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/system-management');
  await page.waitForLoadState('networkidle');
  const reload = page.getByRole('button', { name: 'Sync' });
  await expect(reload).toBeEnabled();
  await reload.click();
  await expect(reload).toBeEnabled();
});

test('profile switches between overview and terms tabs through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /Terms/ }).click();
  await expect(page.getByRole('tab', { name: /Terms/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Overview/ }).click();
  await expect(page.getByRole('tab', { name: /Overview/ })).toHaveAttribute('aria-selected', 'true');
});

test('user management toggles the deleted-user filter through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/user-management');
  await page.waitForLoadState('networkidle');
  const toggle = page.getByRole('button', { name: /Include deleted|Hide deleted/ });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Hide deleted' })).toBeVisible();
});

test('inquiry management switches status tabs through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/inquiry-management');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: 'Pending' }).click();
  await expect(page.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Closed' }).click();
  await expect(page.getByRole('tab', { name: 'Closed' })).toHaveAttribute('aria-selected', 'true');
});

test('inquiries creates, opens, replies to, and deletes an inquiry through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/inquiry');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Submit 1:1 Inquiry|문의 접수/ }).click();
  let dialog = page.getByRole('dialog');
  const title = `UI Inquiry ${Date.now()}`;
  await dialog.getByLabel(/Title|제목/).fill(title);
  await dialog.getByLabel(/Inquiry|Content|내용/).fill('UI inquiry content');
  await dialog.getByRole('button', { name: /Save|저장/ }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();

  const row = page.getByText(title, { exact: true }).locator('xpath=ancestor::tr[1]');
  await row.click();
  dialog = page.getByRole('dialog').last();
  await expect(dialog).toContainText('UI inquiry content');
  await dialog.getByPlaceholder(/message|메시지/i).fill('UI inquiry reply');
  await dialog.getByRole('button', { name: /Send|전송/ }).click();
  await expect(dialog).toContainText('UI inquiry reply');
  await page.keyboard.press('Escape');

  const updatedRow = page.getByText(title, { exact: true }).locator('xpath=ancestor::tr[1]');
  await updatedRow.getByTitle('Delete').click();
  const confirm = page.getByRole('alertdialog');
  await confirm.getByRole('button', { name: /Delete inquiry|문의 삭제/ }).click();
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

test('user management opens a user detail and updates the role through the UI', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/user-management');
  await page.waitForLoadState('networkidle');
  const search = page.getByPlaceholder(/Search/i).first();
  await search.fill('user@test.com');
  const row = page.getByText('user@test.com', { exact: true }).locator('xpath=ancestor::tr[1]');
  await row.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('user@test.com');
  const roleSelect = dialog.getByRole('combobox').first();
  await roleSelect.click();
  await page.getByRole('option', { name: /admin/i }).click();
  await dialog.getByRole('button', { name: /Save role|역할 저장/ }).click();
  await expect(dialog).toContainText(/admin/i);
  await page.keyboard.press('Escape');
});
