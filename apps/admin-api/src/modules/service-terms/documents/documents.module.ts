import { Module } from '@nestjs/common';

import { ServiceTermDocumentsController } from './documents.controller';

@Module({ controllers: [ServiceTermDocumentsController] })
export class ServiceTermDocumentsModule {}
