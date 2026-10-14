import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigAdminEmailModule } from '#/modules/system-config/admin-email/admin-email.module';
import { GetSystemConfigHandler } from '#/modules/system-config/get-system-config.handler';
import { SystemConfigNotificationModule } from '#/modules/system-config/notification/notification.module';
import { SystemConfigOAuthModule } from '#/modules/system-config/oauth/oauth.module';
import { SystemConfigController } from '#/modules/system-config/system-config.controller';
import { UpdateSystemConfigHandler } from '#/modules/system-config/update-system-config.handler';
import { SystemConfigWebhookModule } from '#/modules/system-config/webhook/webhook.module';

@Module({
  imports: [CqrsModule, SystemConfigOAuthModule, SystemConfigNotificationModule, SystemConfigWebhookModule, SystemConfigAdminEmailModule],
  controllers: [SystemConfigController],
  providers: [GetSystemConfigHandler, UpdateSystemConfigHandler],
})
export class SystemConfigModule {}
