import { GetAdminEmailConfigHandler } from '#/modules/system-configs/handlers/get-admin-email-config.handler';
import { GetAdminWebhookConfigHandler } from '#/modules/system-configs/handlers/get-admin-webhook-config.handler';
import { TestAdminEmailHandler } from '#/modules/system-configs/handlers/test-admin-email.handler';
import { TestMessengerHandler } from '#/modules/system-configs/handlers/test-messenger.handler';
import { TestPushHandler } from '#/modules/system-configs/handlers/test-push.handler';
import { TestSmsHandler } from '#/modules/system-configs/handlers/test-sms.handler';

import { CreateOAuthIconPresignedUrlHandler } from './create-oauth-icon-presigned-url.handler';
import { GetHolidaysHandler } from './get-holidays.handler';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { SyncSystemConfigHandler } from './sync-system-config.handler';
import { TestEmailHandler } from './test-email.handler';
import { TestWebhookHandler } from './test-webhook.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';
import { UpdateSystemSettingsHandler } from './update-system-settings.handler';

export * from './create-oauth-icon-presigned-url.handler';
export * from './get-holidays.handler';
export * from './get-system-config.handler';
export * from './sync-system-config.handler';
export * from './test-email.handler';
export * from './test-webhook.handler';
export * from './update-system-config.handler';
export * from './update-system-settings.handler';
export * from '#/modules/system-configs/handlers/get-admin-email-config.handler';
export * from '#/modules/system-configs/handlers/get-admin-webhook-config.handler';
export * from '#/modules/system-configs/handlers/test-admin-email.handler';
export * from '#/modules/system-configs/handlers/test-messenger.handler';
export * from '#/modules/system-configs/handlers/test-push.handler';
export * from '#/modules/system-configs/handlers/test-sms.handler';

export const SYSTEM_CONFIG_HANDLERS = [GetSystemConfigHandler, GetHolidaysHandler, GetAdminEmailConfigHandler, GetAdminWebhookConfigHandler, TestAdminEmailHandler, UpdateSystemConfigHandler, UpdateSystemSettingsHandler, SyncSystemConfigHandler, TestWebhookHandler, TestEmailHandler, TestSmsHandler, TestPushHandler, TestMessengerHandler, CreateOAuthIconPresignedUrlHandler];
