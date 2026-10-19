import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AutoCloseSupportRoomsHandler } from '#/modules/support/notification/auto-close-support-rooms.handler';
import { CheckUnansweredSupportRoomsHandler } from '#/modules/support/notification/check-unanswered-support-rooms.handler';
import { InquiryWebhookService } from '#/modules/support/notification/inquiry-webhook.service';
import { SupportInquiryScheduler } from '#/modules/support/notification/support-inquiry.scheduler';
import { SupportRoomCreatedWebhookHandler } from '#/modules/support/notification/support-room-created-webhook.handler';
import { SupportRoomsModule } from '#/modules/support/room/rooms.module';
import { SystemConfigsModule } from '#/modules/system-config/system-configs.module';

@Module({
  imports: [CqrsModule, SystemConfigsModule, SupportRoomsModule],
  providers: [CheckUnansweredSupportRoomsHandler, AutoCloseSupportRoomsHandler, InquiryWebhookService, SupportInquiryScheduler, SupportRoomCreatedWebhookHandler],
  exports: [InquiryWebhookService],
})
export class SupportNotificationModule {}
