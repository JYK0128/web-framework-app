import { Module } from '@nestjs/common';

import { FaqsController } from '#/modules/faqs/faqs.controller';

@Module({ controllers: [FaqsController] })
export class FaqsModule {}
