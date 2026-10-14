import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TermAgreementsController } from '#/modules/terms/agreements/agreements.controller';
import { GetAgreementHistoryHandler } from '#/modules/terms/agreements/get-agreement-history.handler';
import { GetAgreementsHandler } from '#/modules/terms/agreements/get-agreements.handler';
import { SetAgreementsHandler } from '#/modules/terms/agreements/set-agreements.handler';

@Module({ imports: [CqrsModule], controllers: [TermAgreementsController], providers: [GetAgreementHistoryHandler, GetAgreementsHandler, SetAgreementsHandler] })
export class TermAgreementsModule {}
