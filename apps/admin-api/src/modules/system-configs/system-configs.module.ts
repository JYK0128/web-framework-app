import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminWebhookConfigService } from './admin-webhook-config.service';
import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { OAuthIconUploadController } from './oauth-icon-upload.controller';
import { ServiceConfigController } from './service-config.controller';
import { ServiceSystemConfigClient } from './service-system-config.client';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

@Module({ imports: [CqrsModule], controllers: [ServiceConfigController, SystemConfigController, OAuthIconUploadController], providers: [SystemConfigService, AdminWebhookConfigService, ServiceSystemConfigClient, ...SYSTEM_CONFIG_HANDLERS], exports: [SystemConfigService, AdminWebhookConfigService, ServiceSystemConfigClient] })
export class SystemConfigsModule {}
