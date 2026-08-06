import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetAgreementsHandler, GetTermsHandler, UpdateAgreementsHandler } from './handlers';
import { TermsController } from './terms.controller';

const Handlers = [
  GetTermsHandler,
  GetAgreementsHandler,
  UpdateAgreementsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [TermsController],
  providers: [
    ...Handlers,
  ],
})
export class TermsModule {}
