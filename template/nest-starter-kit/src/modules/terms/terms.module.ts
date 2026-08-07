import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { GetAgreementsHandler, GetTermsHandler, SetAgreementsHandler } from './handlers';
import { TermsController } from './terms.controller';
import { TermsAgreementGuard } from './terms.guard';

const Handlers = [
  GetTermsHandler,
  GetAgreementsHandler,
  SetAgreementsHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [TermsController],
  providers: [
    ...Handlers,
    {
      provide: APP_GUARD,
      useClass: TermsAgreementGuard,
    },
  ],
})
export class TermsModule {}
