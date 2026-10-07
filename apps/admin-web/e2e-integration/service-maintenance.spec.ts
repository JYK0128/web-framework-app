import { expect, test, type Page, type APIRequestContext } from '@playwright/test';

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = '1q2w3e4r1@';
const SERVICE_EMAIL = 'user@test.com';
const SERVICE_PASSWORD = '1q2w3e4r1@';
const SERVICE_WEB_URL = process.env.SERVICE_WEB_URL ?? 'http://localhost:3000';

type MaintenanceConfig = {
  temporary: { enabled: boolean, message: string, startAt: string | null, endAt: string | null }
  recurring: { enabled: boolean, message: string, daysOfWeek: number[], startTime: string, endTime: string }
};

async function signInAdmin(page: Page): Promise<string> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('이메일').fill(ADMIN_EMAIL);
  await page.getByRole('textbox', { name: '비밀번호' }).fill(ADMIN_PASSWORD);

  const loginResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/auth/login'));
  await page.getByRole('button', { name: '로그인' }).click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/profile$/);
  return (await loginResponse.json()).data.accessToken as string;
}

async function signInService(page: Page) {
  await page.goto(`${SERVICE_WEB_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.clock.install();
  await page.getByLabel('이메일').fill(SERVICE_EMAIL);
  await page.getByRole('textbox', { name: '비밀번호' }).fill(SERVICE_PASSWORD);

  const loginResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/auth/login'));
  const initialConfigResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/service-configs') && response.request().method() === 'GET');
  await page.getByRole('button', { name: '로그인' }).click();
  expect((await loginResponsePromise).status()).toBe(200);
  await expect(page).toHaveURL(/\/qna(?:\/)?$/);
  expect((await initialConfigResponsePromise).status()).toBe(200);
}

async function readAdminMaintenance(request: APIRequestContext, auth: { Authorization: string }): Promise<MaintenanceConfig> {
  const response = await request.get('/api/v1/service-config', { headers: auth });
  expect(response.status()).toBe(200);
  return (await response.json()).data.maintenance as MaintenanceConfig;
}

async function readServiceMaintenance(request: APIRequestContext): Promise<MaintenanceConfig> {
  const response = await request.get(`${SERVICE_WEB_URL}/api/v1/service-configs`);
  expect(response.status()).toBe(200);
  return (await response.json()).data.maintenance as MaintenanceConfig;
}

async function saveMaintenanceThroughAdminApi(
  request: APIRequestContext,
  auth: { Authorization: string },
  expected: MaintenanceConfig,
) {
  const updateResponse = await request.patch('/api/v1/service-config', {
    headers: auth,
    data: { maintenance: expected },
  });
  expect(updateResponse.status()).toBe(200);

  // Confirm the write through Admin's read API and Service's public read API.
  expect(await readAdminMaintenance(request, auth)).toEqual(expected);
  expect(await readServiceMaintenance(request)).toEqual(expected);
}

async function refetchServiceConfig(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/service-configs') && response.request().method() === 'GET');
  await page.clock.fastForward(60_001);
  expect((await responsePromise).status()).toBe(200);
}

function activeRecurringWindow() {
  const now = new Date();
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDay = weekdayLabels.indexOf(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Asia/Seoul' }).format(now));
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  const currentMinutes = hour * 60 + minute;
  const formatTime = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

  if (currentMinutes < 10) {
    return { daysOfWeek: [(currentDay + 6) % 7], startTime: '23:00', endTime: '01:00' };
  }
  if (currentMinutes > 1429) {
    return { daysOfWeek: [currentDay], startTime: '22:00', endTime: '23:59' };
  }
  return {
    daysOfWeek: [currentDay],
    startTime: formatTime(currentMinutes - 10),
    endTime: formatTime(currentMinutes + 10),
  };
}

test('Admin-saved maintenance values persist and determine Service screen access', async ({ page, context, request }) => {
  const accessToken = await signInAdmin(page);
  const auth = { Authorization: `Bearer ${accessToken}` };
  const originalMaintenance = await readAdminMaintenance(request, auth);
  expect(await readServiceMaintenance(request)).toEqual(originalMaintenance);

  const servicePage = await context.newPage();

  try {
    await page.goto('/service-settings#maintenance');
    await expect(page.getByRole('heading', { name: '서비스 설정', level: 1 })).toBeVisible();

    const temporarySwitch = page.getByRole('switch', { name: '임시 점검' });
    const recurringSwitch = page.getByRole('switch', { name: '정기 점검' });
    if (await temporarySwitch.getAttribute('aria-checked') === 'true') await temporarySwitch.click();
    if (await recurringSwitch.getAttribute('aria-checked') === 'true') await recurringSwitch.click();

    // Establish a known available state via the real Admin form before Service login.
    const prepareResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/service-config') && response.request().method() === 'PATCH');
    await page.getByRole('button', { name: '저장' }).click();
    expect((await prepareResponsePromise).status()).toBe(200);
    const availableConfig = await readAdminMaintenance(request, auth);
    expect(availableConfig.temporary.enabled).toBe(false);
    expect(availableConfig.recurring.enabled).toBe(false);
    expect(await readServiceMaintenance(request)).toEqual(availableConfig);

    // Authenticate first: an active maintenance window correctly rejects new Service logins.
    await signInService(servicePage);

    if (await temporarySwitch.getAttribute('aria-checked') !== 'true') await temporarySwitch.click();
    const adminSavedMessage = `실저장 임시 점검 ${Date.now()}`;
    await page.getByPlaceholder('예: 현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.').fill(adminSavedMessage);
    const saveResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/service-config') && response.request().method() === 'PATCH');
    await page.getByRole('button', { name: '저장' }).click();
    expect((await saveResponsePromise).status()).toBe(200);

    const adminSavedConfig = await readAdminMaintenance(request, auth);
    expect(adminSavedConfig.temporary).toEqual({ enabled: true, message: adminSavedMessage, startAt: null, endAt: null });
    expect(adminSavedConfig.recurring.enabled).toBe(false);
    expect(await readServiceMaintenance(request)).toEqual(adminSavedConfig);
    await refetchServiceConfig(servicePage);
    await expect(servicePage.getByText('서비스 점검 중입니다', { exact: true })).toBeVisible();
    await expect(servicePage.getByText(adminSavedMessage, { exact: true })).toBeVisible();
    await expect(servicePage.getByRole('heading', { name: 'Q&A', level: 1 })).toHaveCount(0);

    // Save a disabled setting through the Admin form and verify protected content returns.
    if (await temporarySwitch.getAttribute('aria-checked') === 'true') await temporarySwitch.click();
    const disableResponsePromise = page.waitForResponse((response) => response.url().includes('/api/v1/service-config') && response.request().method() === 'PATCH');
    await page.getByRole('button', { name: '저장' }).click();
    expect((await disableResponsePromise).status()).toBe(200);
    const disabledConfig = await readAdminMaintenance(request, auth);
    expect(disabledConfig.temporary.enabled).toBe(false);
    expect(await readServiceMaintenance(request)).toEqual(disabledConfig);
    await refetchServiceConfig(servicePage);
    await expect(servicePage.getByRole('heading', { name: 'Q&A', level: 1 })).toBeVisible();
    await expect(servicePage.getByText(adminSavedMessage, { exact: true })).toHaveCount(0);

    const now = Date.now();
    const futureStart = new Date(now + 60 * 60 * 1000).toISOString();
    const futureEnd = new Date(now + 2 * 60 * 60 * 1000).toISOString();
    const futureConfig: MaintenanceConfig = {
      temporary: { enabled: true, message: `미래 시작 점검 ${Date.now()}`, startAt: futureStart, endAt: futureEnd },
      recurring: { ...disabledConfig.recurring, enabled: false },
    };
    await saveMaintenanceThroughAdminApi(request, auth, futureConfig);
    await refetchServiceConfig(servicePage);
    await expect(servicePage.getByRole('heading', { name: 'Q&A', level: 1 })).toBeVisible();

    const expiredConfig: MaintenanceConfig = {
      temporary: {
        enabled: true,
        message: `종료된 점검 ${Date.now()}`,
        startAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      recurring: { ...disabledConfig.recurring, enabled: false },
    };
    await saveMaintenanceThroughAdminApi(request, auth, expiredConfig);
    await refetchServiceConfig(servicePage);
    await expect(servicePage.getByRole('heading', { name: 'Q&A', level: 1 })).toBeVisible();

    const recurringMessage = `실저장 정기 점검 ${Date.now()}`;
    const recurringWindow = activeRecurringWindow();
    const recurringConfig: MaintenanceConfig = {
      temporary: { enabled: false, message: adminSavedMessage, startAt: null, endAt: null },
      recurring: { enabled: true, message: recurringMessage, daysOfWeek: [], startTime: recurringWindow.startTime, endTime: recurringWindow.endTime },
    };
    await saveMaintenanceThroughAdminApi(request, auth, recurringConfig);
    await refetchServiceConfig(servicePage);
    await expect(servicePage.getByRole('heading', { name: 'Q&A', level: 1 })).toBeVisible();

    const recurringActiveConfig: MaintenanceConfig = {
      temporary: recurringConfig.temporary,
      recurring: { ...recurringConfig.recurring, daysOfWeek: recurringWindow.daysOfWeek },
    };
    await saveMaintenanceThroughAdminApi(request, auth, recurringActiveConfig);
    await refetchServiceConfig(servicePage);
    await expect(servicePage.getByText('서비스 점검 중입니다', { exact: true })).toBeVisible();
    await expect(servicePage.getByText(recurringMessage, { exact: true })).toBeVisible();
    await expect(servicePage.getByRole('heading', { name: 'Q&A', level: 1 })).toHaveCount(0);
  }
  finally {
    const restoreResponse = await request.patch('/api/v1/service-config', {
      headers: auth,
      data: { maintenance: originalMaintenance },
    });
    expect(restoreResponse.status()).toBe(200);
    expect(await readAdminMaintenance(request, auth)).toEqual(originalMaintenance);
    expect(await readServiceMaintenance(request)).toEqual(originalMaintenance);
    await servicePage.close();
  }
});
