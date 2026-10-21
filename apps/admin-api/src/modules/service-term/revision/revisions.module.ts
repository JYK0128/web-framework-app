import { Module } from '@nestjs/common';

import { ServiceTermRevisionsController } from '~/modules/service-term/revision/revisions.controller';

@Module({ controllers: [ServiceTermRevisionsController] })
export class ServiceTermRevisionsModule {}
