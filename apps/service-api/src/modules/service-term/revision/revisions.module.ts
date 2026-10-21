import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetTermRevisionsHandler } from '~/modules/service-term/revision/get-term-revisions.handler';
import { ServiceTermRevisionsController } from '~/modules/service-term/revision/revisions.controller';
import { InternalServiceTermRevisionsController } from '~/modules/service-term/revision/revisions-internal.controller';

@Module({
  imports: [CqrsModule],
  controllers: [ServiceTermRevisionsController, InternalServiceTermRevisionsController],
  providers: [GetTermRevisionsHandler],
})
export class ServiceTermRevisionsModule {}
