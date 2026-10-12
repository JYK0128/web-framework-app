import { TestEmailHandler } from './delivery/test-email.handler';
import { TestMessengerHandler } from './delivery/test-messenger.handler';
import { TestPushHandler } from './delivery/test-push.handler';
import { TestSmsHandler } from './delivery/test-sms.handler';
import { TestWebhookHandler } from './delivery/test-webhook.handler';
import { CreateOAuthIconPresignedUrlHandler } from './oauth/create-oauth-icon-presigned-url.handler';
import { GetHolidaysHandler } from './operation/get-holidays.handler';
import { SyncSystemConfigHandler } from './sync-system-config.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';

export const SERVICE_CONFIG_HANDLERS = [CreateOAuthIconPresignedUrlHandler, GetHolidaysHandler, SyncSystemConfigHandler, TestEmailHandler, TestMessengerHandler, TestPushHandler, TestSmsHandler, TestWebhookHandler, UpdateSystemConfigHandler];
