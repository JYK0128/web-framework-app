import { expect, test } from '@playwright/test';

for (const resource of ['events', 'notices'] as const) {
  test(`${resource}: saves rich text, reloads it for editing, and displays it publicly`, async ({ page, browser }) => {
    const login = await page.request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@', rememberMe: false },
    });
    expect(login.status()).toBe(200);
    const title = `editor-e2e-${resource}-${Date.now()}`;
    const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4WQAAAAASUVORK5CYII=';
    let id: string | undefined;
    const publicPage = await browser.newPage();
    try {
      await page.goto(`/${resource}`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: resource === 'events' ? '이벤트 등록' : '공지 등록' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('textbox', { name: /^제목/ }).fill(title);
      const editor = dialog.getByRole('textbox', { name: '내용', exact: true });
      await expect(editor).toBeVisible();
      await editor.fill('');
      await dialog.getByRole('button', { name: '저장', exact: true }).click();
      await expect(editor).toHaveAttribute('aria-invalid', 'true');
      await expect(dialog.getByRole('alert')).toHaveCount(0);
      await dialog.locator('[data-command="codeView"]').click();
      await dialog.locator('.se-code-viewer').fill(`<h2>${title}</h2><p><strong>서식 본문</strong><span style="color:#ff0000">빨간 글자</span></p><table><tbody><tr><td>표 내용</td></tr></tbody></table><img src="${image}">`);
      await dialog.locator('[data-command="codeView"]').click();
      if (resource === 'events') {
        await dialog.getByRole('button', { name: /시작일/ }).click();
        await page.locator('[role=gridcell]:not([data-outside]) button').filter({ hasText: /^1$/ }).click();
        await page.keyboard.press('Escape');
        await dialog.getByRole('button', { name: /종료일/ }).click();
        await page.locator('[role=gridcell]:not([data-outside]) button').filter({ hasText: /^28$/ }).click();
        await page.keyboard.press('Escape');
        await dialog.getByRole('checkbox', { name: '게시', exact: true }).check();
      }
      // Verify the UI save before publishing through the authenticated API.
      const saved = page.waitForResponse((response) => response.url().endsWith(`/api/v1/${resource}`) && response.request().method() === 'POST');
      await dialog.getByRole('button', { name: '저장', exact: true }).click();
      const response = await saved;
      expect(response.status()).toBe(201);
      const created = (await response.json()).data;
      id = created.id;
      expect(created.content).toContain('<h2>');
      if (resource === 'events') expect(created.status).toBe('published');
      expect(created.content).toMatch(/color:\s*(?:#ff0000|rgb\(255,\s*0,\s*0\))/);
      expect(created.content).toContain(image);
      const publish = await page.request.patch(`/api/v1/${resource}/${id}`, { data: {
        status: 'published',
        content: `${created.content}<script>alert(1)</script><img src="/test.png" onerror="alert(1)"><a href="javascript:alert(1)">안전한 링크</a>`,
      } });
      expect(publish.ok()).toBeTruthy();
      const published = (await publish.json()).data;
      expect(published.content).not.toMatch(/<script|onerror|javascript:/);
      expect(published.content).toContain(image);
      await page.reload();
      await page.getByRole('button', { name: title, exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('heading', { name: title })).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: '닫기', exact: true }).click();
      const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: title, exact: true }) });
      await row.getByRole('button', { name: resource === 'events' ? '이벤트 관리' : '공지 관리' }).click();
      await page.getByRole('menuitem', { name: '수정' }).click();
      const editDialog = page.getByRole('dialog');
      const editBody = editDialog.getByRole('textbox', { name: '내용', exact: true });
      await expect(editBody.locator('h2')).toHaveText(title);
      await editBody.click();
      await editBody.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
      await editBody.press('Enter');
      await editBody.pressSequentially('수정된 내용');
      await expect(editBody).toContainText('수정된 내용');
      const updated = page.waitForResponse((res) => res.url().endsWith(`/api/v1/${resource}/${id}`) && res.request().method() === 'PATCH');
      await editDialog.getByRole('button', { name: '저장', exact: true }).click();
      expect((await updated).ok()).toBeTruthy();
      const read = await page.request.get(`/api/v1/${resource}?search=${encodeURIComponent(title)}`);
      const item = (await read.json()).data.items.find((value: { id: string }) => value.id === id);
      expect(item.content).toContain('수정된 내용');
      expect(item.content).toContain(image);
      await publicPage.goto(`${process.env.SERVICE_WEB_URL ?? 'http://localhost:3000'}/${resource}`);
      const filtered = publicPage.waitForResponse((res) => res.url().includes(`/api/v1/${resource}?`) && res.url().includes(encodeURIComponent(title)) && res.request().method() === 'GET');
      await publicPage.getByRole('textbox').first().fill(title);
      await filtered;
      await publicPage.waitForLoadState('networkidle');
      await publicPage.getByRole('button', { name: title, exact: true }).click();
      await expect(publicPage.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(publicPage.locator('.editor-viewer')).toContainText('수정된 내용');
      await expect(publicPage.locator('.editor-viewer img').first()).toHaveAttribute('src', image);
      await expect(publicPage.getByText('빨간 글자', { exact: true })).toHaveCSS('color', 'rgb(255, 0, 0)');
    }
    finally {
      await publicPage.close();
      if (id) expect((await page.request.delete(`/api/v1/${resource}/${id}`)).ok()).toBeTruthy();
    }
  });
}
