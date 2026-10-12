import { GetServiceConfigHandler } from './get-service-config.handler';
import { CreateOAuthIconPresignedUrlHandler } from './oauth/create-oauth-icon-presigned-url.handler';
import { GetHolidaysHandler } from './operation/get-holidays.handler';
import { SyncSystemConfigHandler } from './sync-system-config.handler';
import { UpdateSystemConfigHandler } from './update-system-config.handler';

export const SERVICE_CONFIG_HANDLERS = [GetServiceConfigHandler, CreateOAuthIconPresignedUrlHandler, GetHolidaysHandler, SyncSystemConfigHandler, UpdateSystemConfigHandler];
