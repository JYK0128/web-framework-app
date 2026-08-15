import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermGroupHandler, CreateTermHandler, DeleteTermGroupHandler, DeleteTermHandler, GetAdminTermGroupsHandler, GetAdminTermsHandler, GetAgreementHistoryHandler, GetAgreementsHandler, GetTermHistoryCursorHandler, GetTermHistoryPageHandler, GetTermsHandler, PublishTermHandler, SetAgreementsHandler, UpdateTermGroupHandler, UpdateTermHandler } from './handlers';
import { TermsController } from './terms.controller';
import { TermsAgreementGuard } from './terms.guard';

const Handlers = [
  GetTermsHandler,
  GetAgreementsHandler,
  GetAgreementHistoryHandler,
  GetTermHistoryCursorHandler,
  GetTermHistoryPageHandler,
  SetAgreementsHandler,
  GetAdminTermGroupsHandler,
  CreateTermGroupHandler,
  UpdateTermGroupHandler,
  DeleteTermGroupHandler,
  GetAdminTermsHandler,
  CreateTermHandler,
  UpdateTermHandler,
  PublishTermHandler,
  DeleteTermHandler,
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
