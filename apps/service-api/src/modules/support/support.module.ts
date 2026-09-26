import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { WebhookDeliveryService } from '#/infra/delivery/channels/webhook/webhook-delivery.service';
import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportAlertService } from './support-alert.service';
import { SupportInquiryScheduler } from './support-inquiry.scheduler';
import { SupportInternalController } from './support-internal.controller';
import { SupportRoomCreatedHandler } from './support-room-created.handler';

@Module({
  imports: [CqrsModule, SystemConfigsModule],
  controllers: [SupportController, SupportInternalController],
  providers: [SupportService, SupportAlertService, SupportInquiryScheduler, SupportRoomCreatedHandler, WebhookDeliveryService],
})
export class SupportModule {}
