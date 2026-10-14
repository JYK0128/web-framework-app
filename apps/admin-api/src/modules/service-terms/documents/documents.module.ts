import { Module } from '@nestjs/common';

import { ServiceTermDocumentsController } from '#/modules/service-terms/documents/documents.controller';

@Module({ controllers: [ServiceTermDocumentsController] })
export class ServiceTermDocumentsModule {}
