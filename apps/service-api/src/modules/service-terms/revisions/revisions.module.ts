import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetTermRevisionsHandler } from '#/modules/service-terms/revisions/get-term-revisions.handler';
import { ServiceTermRevisionsController } from '#/modules/service-terms/revisions/revisions.controller';
import { InternalServiceTermRevisionsController } from '#/modules/service-terms/revisions/revisions-internal.controller';

@Module({
  imports: [CqrsModule],
  controllers: [ServiceTermRevisionsController, InternalServiceTermRevisionsController],
  providers: [GetTermRevisionsHandler],
})
export class ServiceTermRevisionsModule {}
