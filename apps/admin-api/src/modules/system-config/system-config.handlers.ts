import { EnsureAdminEmailDeliveryConfiguredHandler } from './email/ensure-admin-email-delivery-configured.handler';
import { GetAdminEmailConfigHandler } from './email/get-admin-email-config.handler';
import { GetAdminEmailDeliveryConfigHandler } from './email/get-admin-email-delivery-config.handler';
import { TestAdminEmailHandler } from './email/test-admin-email.handler';
import { UpdateAdminEmailConfigHandler } from './email/update-admin-email-config.handler';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { UpdateSystemSettingsHandler } from './update-system-settings.handler';
import { GetAdminWebhookConfigHandler } from './webhook/get-admin-webhook-config.handler';
import { UpdateAdminWebhookConfigHandler } from './webhook/update-admin-webhook-config.handler';

export const SYSTEM_CONFIG_HANDLERS = [EnsureAdminEmailDeliveryConfiguredHandler, GetAdminEmailConfigHandler, GetAdminEmailDeliveryConfigHandler, GetAdminWebhookConfigHandler, GetSystemConfigHandler, TestAdminEmailHandler, UpdateAdminEmailConfigHandler, UpdateAdminWebhookConfigHandler, UpdateSystemSettingsHandler];
