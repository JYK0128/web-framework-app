import { CreateOAuthIconPresignedUrlHandler } from './create-oauth-icon-presigned-url.handler';
import { GetHolidaysHandler } from './get-holidays.handler';
import { SyncSystemConfigHandler } from './sync-system-config.handler';
import { TestEmailHandler } from './test-email.handler';
import { TestMessengerHandler } from './test-messenger.handler';
import { TestPushHandler } from './test-push.handler';
import { TestSmsHandler } from './test-sms.handler';
import { TestWebhookHandler } from './test-webhook.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';

export * from './create-oauth-icon-presigned-url.handler';
export * from './get-holidays.handler';
export * from './sync-system-config.handler';
export * from './test-email.handler';
export * from './test-messenger.handler';
export * from './test-push.handler';
export * from './test-sms.handler';
export * from './test-webhook.handler';
export * from './update-system-config.handler';

export const SERVICE_CONFIG_HANDLERS = [CreateOAuthIconPresignedUrlHandler, GetHolidaysHandler, SyncSystemConfigHandler, TestEmailHandler, TestMessengerHandler, TestPushHandler, TestSmsHandler, TestWebhookHandler, UpdateSystemConfigHandler];
