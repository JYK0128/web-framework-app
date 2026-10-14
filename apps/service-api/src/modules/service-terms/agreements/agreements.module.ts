import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ServiceTermAgreementsController } from '#/modules/service-terms/agreements/agreements.controller';
import { GetServiceAgreementHistoryHandler } from '#/modules/service-terms/agreements/get-service-agreement-history.handler';
import { GetServiceTermAgreementsHandler } from '#/modules/service-terms/agreements/get-service-term-agreements.handler';
import { SetServiceTermAgreementsHandler } from '#/modules/service-terms/agreements/set-service-term-agreements.handler';

@Module({
  imports: [CqrsModule],
  controllers: [ServiceTermAgreementsController],
  providers: [GetServiceTermAgreementsHandler, SetServiceTermAgreementsHandler, GetServiceAgreementHistoryHandler],
})
export class ServiceTermAgreementsModule {}
