import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

import { InquiryAlertService } from './notification/inquiry-alert.service';
import { SupportInquiryScheduler } from './notification/support-inquiry.scheduler';
import { SupportRoomCreatedHandler } from './rooms/support-room-created.handler';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';
import { SupportInternalController } from './support-internal.controller';

@Module({
  imports: [CqrsModule, SystemConfigsModule],
  controllers: [SupportController, SupportInternalController],
  providers: [SupportService, SupportGateway, InquiryAlertService, SupportInquiryScheduler, SupportRoomCreatedHandler],
  exports: [InquiryAlertService],
})
export class SupportModule {}
