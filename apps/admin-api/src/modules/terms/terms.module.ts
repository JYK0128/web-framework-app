import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermGroupHandler, CreateTermHandler, DeleteTermGroupHandler, DeleteTermHandler, GetAdminTermGroupsHandler, GetAdminTermsHandler, GetAgreementsHandler, PublishTermHandler, SetAgreementsHandler, UpdateTermGroupHandler, UpdateTermHandler } from './handlers';
import { TermsController } from './terms.controller';

@Module({
  imports: [CqrsModule],
  controllers: [TermsController],
  providers: [
    CreateTermHandler,
    CreateTermGroupHandler,
    DeleteTermGroupHandler,
    DeleteTermHandler,
    GetAdminTermGroupsHandler,
    GetAdminTermsHandler,
    GetAgreementsHandler,
    PublishTermHandler,
    SetAgreementsHandler,
    UpdateTermGroupHandler,
    UpdateTermHandler,
  ],
})
export class TermsModule {}
