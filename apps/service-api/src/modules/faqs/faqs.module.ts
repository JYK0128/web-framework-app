import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { FaqsController } from './faqs.controller';
import { faqHandlers } from './handlers';

@Module({
  imports: [CqrsModule],
  controllers: [FaqsController],
  providers: [...faqHandlers],
})
export class FaqsModule {}
