import { Module } from '@nestjs/common';

import { AgreeOptionalTermHandler, GetMyAgreementsHandler, GetPublishedTermsHandler, WithdrawOptionalTermHandler } from './handlers';
import { TermsController } from './terms.controller';

@Module({
  controllers: [TermsController],
  providers: [
    GetPublishedTermsHandler,
    GetMyAgreementsHandler,
    AgreeOptionalTermHandler,
    WithdrawOptionalTermHandler,
  ],
})
export class TermsModule {}
