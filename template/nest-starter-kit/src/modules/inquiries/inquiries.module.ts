import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateAdminInquiryMessageHandler, CreateInquiryHandler, CreateInquiryMessageHandler, DeleteAdminInquiryHandler, DeleteInquiryHandler, GetAdminInquiriesHandler, GetAdminInquiryHandler, GetAdminInquiryMessagesHandler, GetInquiriesHandler, GetInquiryHandler, GetInquiryMessagesHandler, SendInquiryCreatedSlackAlertEventHandler, SendInquirySlackAlertEventHandler, UpdateAdminInquiryHandler, UpdateInquiryHandler } from './handlers';
import { InquiriesController } from './inquiries.controller';
import { InquiryMessagesGateway } from './inquiry-messages.gateway';
import { AutoCloseInquiriesScheduler, CheckUnansweredInquiriesScheduler } from './schedulers';

const Handlers = [
  CreateInquiryHandler,
  CreateInquiryMessageHandler,
  CreateAdminInquiryMessageHandler,
  UpdateInquiryHandler,
  UpdateAdminInquiryHandler,
  DeleteInquiryHandler,
  DeleteAdminInquiryHandler,
  GetInquiriesHandler,
  GetInquiryHandler,
  GetInquiryMessagesHandler,
  GetAdminInquiryMessagesHandler,
  GetAdminInquiriesHandler,
  GetAdminInquiryHandler,
  SendInquiryCreatedSlackAlertEventHandler,
  SendInquirySlackAlertEventHandler,
];

const Schedulers = [
  AutoCloseInquiriesScheduler,
  CheckUnansweredInquiriesScheduler,
];

@Module({
  imports: [CqrsModule],
  controllers: [InquiriesController],
  providers: [
    ...Schedulers,
    ...Handlers,
    InquiryMessagesGateway,
  ],
  exports: [InquiryMessagesGateway, CqrsModule],
})
export class InquiriesModule {}
