import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateInquiryHandler, CreateInquiryMessageHandler, DeleteInquiryHandler, GetAdminInquiriesHandler, GetAdminInquiryHandler, GetInquiriesHandler, GetInquiryHandler, GetInquiryMessagesHandler, SendInquiryCreatedSlackAlertEventHandler, SendInquiryMessageAlertEventHandler, SendInquirySlackAlertEventHandler, UpdateInquiryHandler } from './handlers';
import { InquiriesController } from './inquiries.controller';
import { InquiryMessagesGateway } from './inquiry-messages.gateway';
import { InquiryScheduler } from './schedulers/inquiry.scheduler';

const Handlers = [
  CreateInquiryHandler,
  CreateInquiryMessageHandler,
  UpdateInquiryHandler,
  DeleteInquiryHandler,
  GetInquiriesHandler,
  GetInquiryHandler,
  GetInquiryMessagesHandler,
  GetAdminInquiriesHandler,
  GetAdminInquiryHandler,
  SendInquiryCreatedSlackAlertEventHandler,
  SendInquiryMessageAlertEventHandler,
  SendInquirySlackAlertEventHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [InquiriesController],
  providers: [...Handlers, InquiryMessagesGateway, InquiryScheduler],
  exports: [InquiryMessagesGateway, CqrsModule],
})
export class InquiriesModule {}
