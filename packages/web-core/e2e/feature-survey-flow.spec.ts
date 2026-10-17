import { expect, test } from '@playwright/test';

const storyPath = '/iframe.html?id=%EC%9B%B9%EC%BD%94%EC%96%B4-%EC%84%A4%EB%AC%B8-%ED%9D%90%EB%A6%84-surveyflow--survey-flow&viewMode=story';

async function openSurveyFlow(page: import('@playwright/test').Page) {
  await page.goto(storyPath);
  const editor = page;
  await expect(editor.getByRole('heading', { name: '고객 만족도 조사' })).toBeVisible();
  return editor;
}

test('choice branch routes preview, and undo/redo restores the edited flow', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.locator('.react-flow__node-question [role="button"]').nth(0).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();

  await expect(editor.getByText('새 질문 2', { exact: true })).toBeVisible();
  await expect(editor.locator('.react-flow__edge-text').filter({ hasText: '선택지 1' })).toBeVisible();
  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await expect(editor.getByRole('group', { name: /1\. 새 질문 1/ })).toBeVisible();
  await expect(editor.getByRole('group', { name: /2\. 새 질문 2/ })).toHaveCount(0);
  await expect(editor.getByRole('button', { name: '응답 후 계속' })).toBeDisabled();

  await editor.getByRole('radio', { name: '선택지 1' }).first().check();
  await expect(editor.getByRole('group', { name: /2\. 새 질문 2/ })).toBeVisible();
  await expect(editor.getByRole('button', { name: '설문 완료' })).toBeEnabled();
  await editor.getByRole('button', { name: 'Close' }).click();

  await editor.getByRole('button', { name: '실행 취소' }).click();
  await expect(editor.getByText('새 질문 2', { exact: true })).toHaveCount(0);
  await editor.getByRole('button', { name: '다시 실행' }).click();
  await expect(editor.getByText('새 질문 2', { exact: true })).toBeVisible();
});

test('choice branches split the full list in half with handles and edges facing each branch', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  const source = editor.locator('.react-flow__node-question').filter({ hasText: '새 질문 1' });
  for (const [index, option] of ['세 번째 선택지', '네 번째 선택지', '다섯 번째 선택지'].entries()) {
    await editor.getByRole('button', { name: '선택지 추가' }).click();
    await editor.getByRole('textbox', { name: `선택지 ${index + 3}` }).fill(option);
  }
  for (let optionIndex = 0; optionIndex < 5; optionIndex++) {
    await source.getByRole('button').nth(optionIndex).click();
    await editor.getByRole('button', { name: '질문', exact: true }).click();
  }

  const sourceBox = await source.boundingBox();
  expect(sourceBox).not.toBeNull();
  for (let optionIndex = 0; optionIndex < 4; optionIndex++) {
    const handle = await source.locator(`.react-flow__handle[data-handleid="option-${optionIndex}"]`).boundingBox();
    const inputHandle = await source.locator(`.react-flow__handle[data-handleid="option-input-${optionIndex}"]`).boundingBox();
    const branch = await editor.locator('.react-flow__node-question').filter({ hasText: `새 질문 ${optionIndex + 2}` }).boundingBox();
    expect(handle).not.toBeNull();
    expect(inputHandle).not.toBeNull();
    expect(branch).not.toBeNull();
    if (optionIndex < 3) {
      expect(handle!.x).toBeLessThan(sourceBox!.x + sourceBox!.width / 2);
      expect(inputHandle!.x).toBeGreaterThan(sourceBox!.x + sourceBox!.width / 2);
      expect(branch!.x + branch!.width).toBeLessThan(sourceBox!.x);
    }
    else {
      expect(handle!.x).toBeGreaterThan(sourceBox!.x + sourceBox!.width / 2);
      expect(inputHandle!.x).toBeLessThan(sourceBox!.x + sourceBox!.width / 2);
      expect(branch!.x).toBeGreaterThan(sourceBox!.x + sourceBox!.width);
    }
  }
  const firstLeftBranch = await editor.locator('.react-flow__node-question').filter({ hasText: '새 질문 2' }).boundingBox();
  const firstRightBranch = await editor.locator('.react-flow__node-question').filter({ hasText: '새 질문 5' }).boundingBox();
  expect(Math.abs(firstLeftBranch!.y - firstRightBranch!.y)).toBeLessThan(1);
});

test('page nodes split preview into pages and navigation shows the next page', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('button', { name: '페이지 구분', exact: true }).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();

  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  const previewDialog = editor.getByRole('dialog');
  const expectedPreviewHeight = await editor.evaluate(() => window.innerHeight * 0.9);
  await expect.poll(() => previewDialog.evaluate((element) => element.getBoundingClientRect().height)).toBe(expectedPreviewHeight);
  const previewHeight = await previewDialog.evaluate((element) => element.getBoundingClientRect().height);
  await expect(editor.getByText('1 / 2')).toBeVisible();
  await expect(editor.getByRole('group', { name: /새 질문 1/ })).toBeVisible();
  await expect(editor.getByRole('group', { name: /새 질문 2/ })).toHaveCount(0);
  await expect(previewDialog.locator('.survey-preview-body')).toHaveCSS('overflow-y', 'auto');
  await editor.getByRole('button', { name: '다음 페이지' }).click();
  await expect(editor.getByText('2 / 2')).toBeVisible();
  await expect(editor.getByRole('group', { name: /새 질문 2/ })).toBeVisible();
  await expect.poll(() => previewDialog.evaluate((element) => element.getBoundingClientRect().height)).toBe(previewHeight);
});

test('preview keeps a fixed height and scrolls long page content inside the modal', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 361 });
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: /콘텐츠/ }).click();
  await editor.getByText('콘텐츠 페이지 1', { exact: true }).click();
  await editor.getByRole('button', { name: '본문 편집', exact: true }).click();
  await editor.locator('.sun-editor-editable').fill(Array.from({ length: 30 }, (_, index) => `미리보기 내용 ${index + 1}`).join('\n'));
  await editor.getByRole('button', { name: '적용', exact: true }).click();
  await editor.getByRole('button', { name: '미리보기', exact: true }).click();

  const dialog = editor.getByRole('dialog');
  const body = dialog.locator('.survey-preview-body');
  await expect.poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(361);

  await body.hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(dialog.getByRole('button', { name: '설문 완료' })).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(361);
});

test('choice branches follow the selected option and save', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.locator('.react-flow__node-question').filter({ hasText: '새 질문 1' }).getByText('선택지 1', { exact: true }).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.locator('.react-flow__node-question').filter({ hasText: '새 질문 1' }).getByText('선택지 2', { exact: true }).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('button', { name: '저장', exact: true }).click();
  await expect(editor.getByText(/저장됨/)).toBeVisible();

  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await editor.getByRole('radio', { name: '선택지 1' }).check();
  await expect(editor.getByRole('group', { name: /새 질문 2/ })).toBeVisible();
  await expect(editor.getByRole('group', { name: /새 질문 3/ })).toHaveCount(0);
  await editor.getByRole('button', { name: 'Close' }).click();

  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await editor.getByRole('radio', { name: '선택지 2' }).check();
  await expect(editor.getByRole('group', { name: /새 질문 3/ })).toBeVisible();
  await expect(editor.getByRole('group', { name: /새 질문 2/ })).toHaveCount(0);
});

test('deleting an earlier choice reindexes its branch and preview still follows it', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.locator('.react-flow__node-question [role="button"]').nth(1).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();

  await editor.getByText('새 질문 1', { exact: true }).click();
  await editor.getByRole('button', { name: '선택지 1 삭제' }).click();
  await editor.getByRole('alertdialog').getByRole('button', { name: '삭제' }).click();

  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await editor.getByRole('radio', { name: '선택지 2' }).check();
  await expect(editor.getByRole('group', { name: /새 질문 2/ })).toBeVisible();
});

test('deleting an automatic end edge leaves the path open and blocks save', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  const endEdge = editor.getByRole('group', { name: /Edge from question-.* to end/ });
  await endEdge.click();
  await page.keyboard.press('Delete');

  await editor.getByRole('button', { name: '저장', exact: true }).click();
  await expect(editor.getByRole('alert').filter({ hasText: '경로가 연결되지 않았습니다' })).toBeVisible();
  await expect(editor.getByRole('group', { name: /Edge from question-.* to end/ })).toHaveCount(0);
});

test('inserting the first question positions it between the start and end nodes', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  const start = await editor.locator('.react-flow__node-start').boundingBox();
  const question = await editor.locator('.react-flow__node-question').boundingBox();
  const end = await editor.locator('.react-flow__node-end').boundingBox();

  expect(start).not.toBeNull();
  expect(question).not.toBeNull();
  expect(end).not.toBeNull();
  expect(question!.y).toBeGreaterThan(start!.y + start!.height);
  expect(question!.y + question!.height).toBeLessThan(end!.y);
});

test('changing a linear question to text keeps the route and renders a text response field', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('combobox', { name: '질문 형식' }).click();
  await editor.getByRole('option', { name: '주관식' }).click();
  await editor.getByRole('button', { name: '저장', exact: true }).click();
  await expect(editor.getByText(/저장됨/)).toBeVisible();

  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await expect(editor.getByPlaceholder('답변을 입력하세요')).toBeVisible();
  await expect(editor.getByRole('button', { name: '설문 완료' })).toBeEnabled();
});

test('deleting a question reconnects the start path and leaves an empty preview', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('button', { name: '노드 삭제' }).click();
  await expect(editor.getByText('새 질문 1', { exact: true })).toHaveCount(0);

  await editor.getByRole('button', { name: '저장', exact: true }).click();
  await expect(editor.getByText(/저장됨/)).toBeVisible();
  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await expect(editor.getByText('미리볼 질문이 없습니다.')).toBeVisible();
});

test('undo and redo of deleting a question restore the normalized route', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('button', { name: '노드 삭제' }).click();
  await expect(editor.getByText('새 질문 1', { exact: true })).toHaveCount(0);

  await editor.getByRole('button', { name: '실행 취소' }).click();
  await expect(editor.getByText('새 질문 1', { exact: true })).toBeVisible();
  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await expect(editor.getByRole('group', { name: /새 질문 1/ })).toBeVisible();
  await expect(editor.getByRole('button', { name: '설문 완료' })).toBeEnabled();
  await editor.getByRole('button', { name: 'Close' }).click();

  await editor.getByRole('button', { name: '다시 실행' }).click();
  await expect(editor.getByText('새 질문 1', { exact: true })).toHaveCount(0);
  await editor.getByRole('button', { name: '저장', exact: true }).click();
  await expect(editor.getByText(/저장됨/)).toBeVisible();
});

test('mobile editor can add a question and open its preview', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('button', { name: '미리보기', exact: true }).click();

  await expect(editor.getByRole('group', { name: /새 질문 1/ })).toBeVisible();
  await expect(editor.getByRole('button', { name: '설문 완료' })).toBeEnabled();
});

test('content editor keeps its actions visible and scrolls long content inside the editable area', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 361 });
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: /콘텐츠/ }).click();
  await editor.getByText('콘텐츠 페이지 1', { exact: true }).click();
  await editor.getByRole('button', { name: '본문 편집', exact: true }).click();

  const dialog = editor.getByRole('dialog', { name: '콘텐츠 편집' });
  const editable = dialog.locator('.sun-editor-editable');
  await editable.fill(Array.from({ length: 40 }, (_, index) => `스크롤 확인 줄 ${index + 1}`).join('\n'));

  await expect(dialog.getByRole('button', { name: '적용' })).toBeVisible();
  await expect(dialog.locator('.se-toolbar')).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(361);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(361);

  await editable.evaluate((element) => {
    element.scrollTop = 0;
  });
  await editable.click();
  await page.keyboard.press('PageDown');
  await expect.poll(() => editable.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(dialog.getByRole('button', { name: '적용' })).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBe(0);
});

test('multiple-choice preview visits every selected option branch', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('combobox', { name: '질문 형식' }).click();
  await editor.getByRole('option', { name: '복수 선택' }).click();

  await editor.locator('.react-flow__node-question [role="button"]').nth(0).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByText('새 질문 1', { exact: true }).click();
  await editor.locator('.react-flow__node-question [role="button"]').nth(1).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();

  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await editor.getByRole('checkbox', { name: '선택지 1' }).first().check();
  await editor.getByRole('checkbox', { name: '선택지 2' }).first().check();
  await expect(editor.getByRole('group', { name: /새 질문 2/ })).toBeVisible();
  await expect(editor.getByRole('group', { name: /새 질문 3/ })).toBeVisible();
});

test('choice inputs update inline, flag duplicates, and appear in preview', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.getByRole('button', { name: '선택지 추가' }).click();
  const newChoice = editor.getByRole('textbox', { name: '선택지 3' });
  await editor.getByRole('button', { name: '저장', exact: true }).first().click();
  await expect(editor.getByRole('alert').filter({ hasText: '선택지를 입력하세요' })).toBeVisible();
  await newChoice.fill('선택지 1');
  await expect(newChoice).toHaveAttribute('aria-invalid', 'true');
  await expect(editor.getByText('같은 선택지가 이미 있습니다.')).toBeVisible();
  await editor.getByRole('button', { name: '저장', exact: true }).first().click();
  await expect(editor.getByRole('alert').filter({ hasText: '중복 선택지' })).toBeVisible();

  await newChoice.fill('수정된 응답');
  await expect(newChoice).toHaveAttribute('aria-invalid', 'false');
  await editor.getByRole('button', { name: '저장', exact: true }).first().click();
  await expect(editor.getByText(/저장됨/)).toBeVisible();
  await editor.getByRole('button', { name: '미리보기', exact: true }).click();
  await expect(editor.getByRole('radio', { name: '수정된 응답' })).toBeVisible();
});

test('title edit prevents empty values and saves the trimmed title', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '설문 제목 수정' }).click();
  const dialog = editor.getByRole('dialog');
  const titleInput = dialog.getByRole('textbox', { name: '설문 제목' });
  await titleInput.fill('   ');
  await expect(dialog.getByRole('button', { name: '저장' })).toBeDisabled();
  await titleInput.fill('  신규 고객 설문  ');
  await dialog.getByRole('button', { name: '저장' }).click();
  await expect(editor.getByRole('heading', { name: '신규 고객 설문' })).toBeVisible();
  await editor.getByRole('button', { name: '저장', exact: true }).first().click();
  await expect(editor.getByText(/저장됨/)).toBeVisible();
});

test('auto arrange separates the nodes in a branched flow', async ({ page }) => {
  const editor = await openSurveyFlow(page);
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  await editor.locator('.react-flow__node-question [role="button"]').nth(0).click();
  await editor.getByRole('button', { name: '질문', exact: true }).click();
  const viewport = editor.locator('.react-flow__viewport');
  const initialZoom = await viewport.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  await editor.getByRole('button', { name: '자동 정렬', exact: true }).click();
  await expect.poll(() => viewport.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a)).toBeCloseTo(initialZoom);
  const canvas = editor.locator('.react-flow');
  const startNode = editor.locator('.react-flow__node-start');
  await expect.poll(async () => {
    const canvasBox = await canvas.boundingBox();
    const startBox = await startNode.boundingBox();
    if (!canvasBox || !startBox) {
      return null;
    }
    return Math.round(startBox.y - canvasBox.y);
  }).toBe(64);

  const boxes = await editor.locator('.react-flow__node').evaluateAll((nodes) => nodes.map((node) => {
    const { x, y, width, height } = node.getBoundingClientRect();
    return { x, y, width, height };
  }));
  expect(boxes).toHaveLength(4);
  for (let first = 0; first < boxes.length; first++) {
    for (let second = first + 1; second < boxes.length; second++) {
      const a = boxes[first];
      const b = boxes[second];
      const separated = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      expect(separated, `nodes ${first} and ${second} overlap`).toBe(true);
    }
  }
});
