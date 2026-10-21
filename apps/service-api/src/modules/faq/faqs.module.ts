import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateFaqHandler } from '~/modules/faq/create-faq.handler';
import { DeleteFaqHandler } from '~/modules/faq/delete-faq.handler';
import { FaqsController } from '~/modules/faq/faqs.controller';
import { InternalFaqsController } from '~/modules/faq/faqs-internal.controller';
import { GetFaqHandler } from '~/modules/faq/get-faq.handler';
import { GetFaqsHandler } from '~/modules/faq/get-faqs.handler';
import { GetInternalFaqsHandler } from '~/modules/faq/get-internal-faqs.handler';
import { UpdateFaqHandler } from '~/modules/faq/update-faq.handler';

@Module({
  imports: [CqrsModule],
  controllers: [FaqsController, InternalFaqsController],
  providers: [GetFaqHandler, GetFaqsHandler, GetInternalFaqsHandler, CreateFaqHandler, UpdateFaqHandler, DeleteFaqHandler],
})
export class FaqsModule {}
