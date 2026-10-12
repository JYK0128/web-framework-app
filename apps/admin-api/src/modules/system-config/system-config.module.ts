import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigAdminEmailModule } from './admin-email/admin-email.module';
import { SystemConfigDeliveryModule } from './delivery/delivery.module';
import { GetSystemConfigHandler } from './get-system-config.handler';
import { SystemConfigController } from './system-config.controller';
import { UpdateSystemConfigHandler } from './update-system-config.handler';
import { SystemConfigWebhookModule } from './webhook/webhook.module';

@Module({
  imports: [CqrsModule, SystemConfigDeliveryModule, SystemConfigWebhookModule, SystemConfigAdminEmailModule],
  controllers: [SystemConfigController],
  providers: [GetSystemConfigHandler, UpdateSystemConfigHandler],
})
export class SystemConfigModule {}
