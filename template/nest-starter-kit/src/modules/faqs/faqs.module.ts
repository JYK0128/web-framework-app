import { Module } from '@nestjs/common';

import { FaqsController } from './faqs.controller';

@Module({
  controllers: [FaqsController],
})
export class FaqsModule {}
