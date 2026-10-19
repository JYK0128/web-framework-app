import { GetAdminEmailConfigHandler, TestAdminEmailHandler } from './admin-email-config.handler';
import { GetAdminWebhookConfigHandler } from './admin-webhook-config.handler';
import { CreateOAuthIconPresignedUrlHandler } from './create-oauth-icon-presigned-url.handler';
import { GetHolidaysHandler } from './get-holidays.handler';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { SyncSystemConfigHandler } from './sync-system-config.handler';
import { TestMessengerHandler, TestPushHandler, TestSmsHandler } from './test-channel.handler';
import { TestEmailHandler } from './test-email.handler';
import { TestWebhookHandler } from './test-webhook.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';
import { UpdateSystemSettingsHandler } from './update-system-settings.handler';

export * from './admin-email-config.handler';
export * from './admin-webhook-config.handler';
export * from './create-oauth-icon-presigned-url.handler';
export * from './get-holidays.handler';
export * from './get-system-config.handler';
export * from './sync-system-config.handler';
export * from './test-channel.handler';
export * from './test-email.handler';
export * from './test-webhook.handler';
export * from './update-system-config.handler';
export * from './update-system-settings.handler';

export const SYSTEM_CONFIG_HANDLERS = [GetSystemConfigHandler, GetHolidaysHandler, GetAdminEmailConfigHandler, GetAdminWebhookConfigHandler, TestAdminEmailHandler, UpdateSystemConfigHandler, UpdateSystemSettingsHandler, SyncSystemConfigHandler, TestWebhookHandler, TestEmailHandler, TestSmsHandler, TestPushHandler, TestMessengerHandler, CreateOAuthIconPresignedUrlHandler];
