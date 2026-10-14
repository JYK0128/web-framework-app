import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateInternalServiceTermHandler } from '#/modules/service-terms/documents/create-internal-service-term.handler';
import { DeleteInternalServiceTermHandler } from '#/modules/service-terms/documents/delete-internal-service-term.handler';
import { ServiceTermDocumentsController } from '#/modules/service-terms/documents/documents.controller';
import { InternalServiceTermDocumentsController } from '#/modules/service-terms/documents/documents-internal.controller';
import { GetInternalServiceTermsHandler } from '#/modules/service-terms/documents/get-internal-service-terms.handler';
import { GetServiceTermHandler } from '#/modules/service-terms/documents/get-service-term.handler';
import { GetServiceTermsHandler } from '#/modules/service-terms/documents/get-service-terms.handler';
import { PublishInternalServiceTermHandler } from '#/modules/service-terms/documents/publish-internal-service-term.handler';
import { UpdateInternalServiceTermHandler } from '#/modules/service-terms/documents/update-internal-service-term.handler';

@Module({
  imports: [CqrsModule],
  controllers: [ServiceTermDocumentsController, InternalServiceTermDocumentsController],
  providers: [GetServiceTermsHandler, GetServiceTermHandler, GetInternalServiceTermsHandler, CreateInternalServiceTermHandler, UpdateInternalServiceTermHandler, DeleteInternalServiceTermHandler, PublishInternalServiceTermHandler],
})
export class ServiceTermDocumentsModule {}
