import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetAgreementHistoryHandler } from './agreements/get-agreement-history.handler';
import { GetAgreementsHandler } from './agreements/get-agreements.handler';
import { SetAgreementsHandler } from './agreements/set-agreements.handler';
import { CreateTermHandler } from './documents/create-term.handler';
import { DeleteTermHandler } from './documents/delete-term.handler';
import { GetTermHandler } from './documents/get-term.handler';
import { GetTermsHandler } from './documents/get-terms.handler';
import { PublishTermHandler } from './documents/publish-term.handler';
import { UpdateTermHandler } from './documents/update-term.handler';
import { CreateTermGroupHandler } from './groups/create-term-group.handler';
import { DeleteTermGroupHandler } from './groups/delete-term-group.handler';
import { GetTermGroupsHandler } from './groups/get-term-groups.handler';
import { UpdateTermGroupHandler } from './groups/update-term-group.handler';
import { GetTermRevisionsHandler } from './revisions/get-term-revisions.handler';
import { TermsController } from './terms.controller';

@Module({
  imports: [CqrsModule],
  controllers: [TermsController],
  providers: [
    GetAgreementsHandler,
    GetAgreementHistoryHandler,
    SetAgreementsHandler,
    CreateTermHandler,
    DeleteTermHandler,
    GetTermHandler,
    GetTermsHandler,
    PublishTermHandler,
    UpdateTermHandler,
    CreateTermGroupHandler,
    DeleteTermGroupHandler,
    GetTermGroupsHandler,
    UpdateTermGroupHandler,
    GetTermRevisionsHandler,
  ],
})
export class TermsModule {}
