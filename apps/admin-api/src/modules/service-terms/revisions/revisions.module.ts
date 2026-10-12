import { Module } from '@nestjs/common';

import { ServiceTermRevisionsController } from './revisions.controller';

@Module({ controllers: [ServiceTermRevisionsController] })
export class ServiceTermRevisionsModule {}
