import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetAgreementHistoryHandler } from './agreements/get-agreement-history.handler';
import { GetAgreementsHandler } from './agreements/get-agreements.handler';
import { SetAgreementsHandler } from './agreements/set-agreements.handler';
import { CreateTermHandler } from './create-term.handler';
import { DeleteTermHandler } from './delete-term.handler';
import { GetOperatorTermHandler } from './get-operator-term.handler';
import { GetOperatorTermsHandler } from './get-operator-terms.handler';
import { CreateTermGroupHandler } from './groups/create-term-group.handler';
import { DeleteTermGroupHandler } from './groups/delete-term-group.handler';
import { GetOperatorTermGroupsHandler } from './groups/get-operator-term-groups.handler';
import { UpdateTermGroupHandler } from './groups/update-term-group.handler';
import { PublishTermHandler } from './publish-term.handler';
import { GetTermRevisionsHandler } from './revisions/get-term-revisions.handler';
import { OperatorTermsController } from './terms.controller';
import { UpdateTermHandler } from './update-term.handler';

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
    GetOperatorTermHandler,
    GetAgreementsHandler,
    GetAgreementHistoryHandler,
    GetTermRevisionsHandler,
    PublishTermHandler,
    SetAgreementsHandler,
    UpdateTermGroupHandler,
    UpdateTermHandler,
  ],
})
export class TermsModule {}
