import { Module } from '@nestjs/common';

import { ServiceTermDocumentsController } from '#/modules/service-term/document/documents.controller';

@Module({ controllers: [ServiceTermDocumentsController] })
export class ServiceTermDocumentsModule {}
