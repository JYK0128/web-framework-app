import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { FaqsController } from './faqs.controller';
import { CreateFaqHandler, DeleteFaqHandler, GetAdminFaqsHandler, GetFaqsHandler, UpdateFaqHandler } from './handlers';

const Handlers = [
  CreateFaqHandler,
  UpdateFaqHandler,
  DeleteFaqHandler,
  GetFaqsHandler,
  GetAdminFaqsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [FaqsController],
  providers: [...Handlers],
})
export class FaqsModule {}
