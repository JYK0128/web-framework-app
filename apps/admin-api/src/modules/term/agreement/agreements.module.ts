import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TermAgreementsController } from '~/modules/term/agreement/agreements.controller';
import { GetAgreementHistoryHandler } from '~/modules/term/agreement/get-agreement-history.handler';
import { GetAgreementsHandler } from '~/modules/term/agreement/get-agreements.handler';
import { SetAgreementsHandler } from '~/modules/term/agreement/set-agreements.handler';

@Module({ imports: [CqrsModule], controllers: [TermAgreementsController], providers: [GetAgreementHistoryHandler, GetAgreementsHandler, SetAgreementsHandler] })
export class TermAgreementsModule {}
