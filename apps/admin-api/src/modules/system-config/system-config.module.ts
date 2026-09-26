import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SYSTEM_CONFIG_HANDLERS } from './handlers';
import { OAuthIconUploadController } from './oauth-icon-upload.controller';
import { ServiceSystemConfigClient } from './service-system-config.client';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

@Module({ imports: [CqrsModule], controllers: [SystemConfigController, OAuthIconUploadController], providers: [SystemConfigService, ServiceSystemConfigClient, ...SYSTEM_CONFIG_HANDLERS], exports: [SystemConfigService, ServiceSystemConfigClient] })
export class SystemConfigModule {}
