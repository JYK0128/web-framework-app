import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateInquiryHandler, CreateInquiryMessageHandler, DeleteInquiryHandler, GetAdminInquiriesHandler, GetAdminInquiryHandler, GetInquiriesHandler, GetInquiryHandler, GetInquiryMessagesHandler, UpdateInquiryHandler } from './handlers';
import { InquiriesController } from './inquiries.controller';
import { InquiryMessagesGateway } from './inquiry-messages.gateway';

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
];

@Module({
  imports: [CqrsModule],
  controllers: [InquiriesController],
  providers: [...Handlers, InquiryMessagesGateway],
})
export class InquiriesModule {}
