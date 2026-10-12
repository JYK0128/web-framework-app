import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigAdminEmailModule } from './admin-email/admin-email.module';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { SystemConfigNotificationModule } from './notification/notification.module';
import { SystemConfigOAuthModule } from './oauth/oauth.module';
import { SystemConfigController } from './system-config.controller';
import { UpdateSystemConfigHandler } from './update-system-config.handler';
import { SystemConfigWebhookModule } from './webhook/webhook.module';

@Module({
  imports: [CqrsModule, SystemConfigOAuthModule, SystemConfigNotificationModule, SystemConfigWebhookModule, SystemConfigAdminEmailModule],
  controllers: [SystemConfigController],
  providers: [GetSystemConfigHandler, UpdateSystemConfigHandler],
})
export class SystemConfigModule {}
