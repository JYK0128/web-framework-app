import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermGroupHandler, CreateTermHandler, DeleteTermGroupHandler, DeleteTermHandler, GetAgreementHistoryHandler, GetAgreementsHandler, GetOperatorTermGroupsHandler, GetOperatorTermsHandler, PublishTermHandler, SetAgreementsHandler, UpdateTermGroupHandler, UpdateTermHandler } from './handlers';
import { OperatorTermsController } from './terms.controller';

@Module({
  imports: [CqrsModule],
  controllers: [OperatorTermsController],
  providers: [
    CreateTermHandler,
    CreateTermGroupHandler,
    DeleteTermGroupHandler,
    DeleteTermHandler,
    GetOperatorTermGroupsHandler,
    GetOperatorTermsHandler,
    GetAgreementsHandler,
    GetAgreementHistoryHandler,
    PublishTermHandler,
    SetAgreementsHandler,
    UpdateTermGroupHandler,
    UpdateTermHandler,
  ],
})
export class TermsModule {}
