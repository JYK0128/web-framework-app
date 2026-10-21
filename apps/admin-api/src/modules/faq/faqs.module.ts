import { Module } from '@nestjs/common';

import { FaqsController } from '~/modules/faq/faqs.controller';

@Module({ controllers: [FaqsController] })
export class FaqsModule {}
