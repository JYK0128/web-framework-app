import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TermAgreementsController } from './agreements.controller';
import { GetAgreementHistoryHandler } from './get-agreement-history.handler';
import { GetAgreementsHandler } from './get-agreements.handler';
import { SetAgreementsHandler } from './set-agreements.handler';

@Module({ imports: [CqrsModule], controllers: [TermAgreementsController], providers: [GetAgreementHistoryHandler, GetAgreementsHandler, SetAgreementsHandler] })
export class TermAgreementsModule {}
