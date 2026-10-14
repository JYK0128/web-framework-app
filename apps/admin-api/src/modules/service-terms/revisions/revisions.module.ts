import { Module } from '@nestjs/common';

import { ServiceTermRevisionsController } from '#/modules/service-terms/revisions/revisions.controller';

@Module({ controllers: [ServiceTermRevisionsController] })
export class ServiceTermRevisionsModule {}
