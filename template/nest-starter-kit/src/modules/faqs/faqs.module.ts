import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { FaqsController } from './faqs.controller';
import { CreateFaqHandler, DeleteFaqHandler, GetAdminFaqsHandler, GetFaqsHandler, MarkHelpfulFaqHandler, UpdateFaqHandler } from './handlers';

const Handlers = [
  CreateFaqHandler,
  UpdateFaqHandler,
  DeleteFaqHandler,
  MarkHelpfulFaqHandler,
  GetFaqsHandler,
  GetAdminFaqsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [FaqsController],
  providers: [...Handlers],
})
export class FaqsModule {}
