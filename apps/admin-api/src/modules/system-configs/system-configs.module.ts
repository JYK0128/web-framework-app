import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminWebhookConfigService } from './admin-webhook-config.service';
import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { OAuthIconUploadController } from './oauth-icon-upload.controller';
import { ServiceConfigController } from './service-config.controller';
import { ServiceSystemConfigClient } from './service-system-config.client';
import { SystemConfigController } from './system-config.controller';
import { AdminEmailConfigService } from './admin-email-config.service';

@Module({ imports: [CqrsModule], controllers: [ServiceConfigController, SystemConfigController, OAuthIconUploadController], providers: [AdminEmailConfigService, AdminWebhookConfigService, ServiceSystemConfigClient, ...SYSTEM_CONFIG_HANDLERS], exports: [AdminEmailConfigService, AdminWebhookConfigService, ServiceSystemConfigClient] })
export class SystemConfigsModule {}
