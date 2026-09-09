import { GetAdminSystemConfigHandler } from './get-admin-system-config.handler';
import { GetHolidaysHandler } from './get-holidays.handler';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { ReloadSystemConfigHandler } from './reload-system-config.handler';
import { SystemConfigUpdatedEventHandler } from './system-config-updated.event-handler';
import { TestMessengerHandler, TestPushHandler, TestSmsHandler } from './test-channel.handler';
import { TestEmailHandler } from './test-email.handler';
import { TestWebhookHandler } from './test-webhook.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';

export * from './get-admin-system-config.handler';
export * from './get-holidays.handler';
export * from './get-system-config.handler';
export * from './system-config-updated.event-handler';
export * from './test-channel.handler';
export * from './test-email.handler';
export * from './test-webhook.handler';
export * from './update-system-config.handler';

export const SYSTEM_CONFIG_HANDLERS = [
  ReloadSystemConfigHandler,
  GetSystemConfigHandler,
  GetAdminSystemConfigHandler,
  GetHolidaysHandler,
  UpdateSystemConfigHandler,
  SystemConfigUpdatedEventHandler,
  TestWebhookHandler,
  TestEmailHandler,
  TestSmsHandler,
  TestPushHandler,
  TestMessengerHandler,
];
