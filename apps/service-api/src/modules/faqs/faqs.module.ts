import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateFaqHandler } from '#/modules/faqs/create-faq.handler';
import { DeleteFaqHandler } from '#/modules/faqs/delete-faq.handler';
import { FaqsController } from '#/modules/faqs/faqs.controller';
import { faqHandlers } from '#/modules/faqs/faqs.handlers';
import { InternalFaqsController } from '#/modules/faqs/faqs-internal.controller';
import { GetInternalFaqsHandler } from '#/modules/faqs/get-internal-faqs.handler';
import { UpdateFaqHandler } from '#/modules/faqs/update-faq.handler';

@Module({
  imports: [CqrsModule],
  controllers: [FaqsController, InternalFaqsController],
  providers: [...faqHandlers, GetInternalFaqsHandler, CreateFaqHandler, UpdateFaqHandler, DeleteFaqHandler],
})
export class FaqsModule {}
