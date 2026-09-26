import { CreateOAuthIconPresignedUrlHandler } from './create-oauth-icon-presigned-url.handler';
import { GetHolidaysHandler } from './get-holidays.handler';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { SyncSystemConfigHandler } from './sync-system-config.handler';
import { TestMessengerHandler, TestPushHandler, TestSmsHandler } from './test-channel.handler';
import { TestEmailHandler } from './test-email.handler';
import { TestWebhookHandler } from './test-webhook.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';

export * from './create-oauth-icon-presigned-url.handler';
export * from './get-holidays.handler';
export * from './get-system-config.handler';
export * from './sync-system-config.handler';
export * from './test-channel.handler';
export * from './test-email.handler';
export * from './test-webhook.handler';
export * from './update-system-config.handler';

export const SYSTEM_CONFIG_HANDLERS = [GetSystemConfigHandler, GetHolidaysHandler, UpdateSystemConfigHandler, SyncSystemConfigHandler, TestWebhookHandler, TestEmailHandler, TestSmsHandler, TestPushHandler, TestMessengerHandler, CreateOAuthIconPresignedUrlHandler];
