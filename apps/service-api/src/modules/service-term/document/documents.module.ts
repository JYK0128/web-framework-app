import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateInternalServiceTermHandler } from '#/modules/service-term/document/create-internal-service-term.handler';
import { DeleteInternalServiceTermHandler } from '#/modules/service-term/document/delete-internal-service-term.handler';
import { ServiceTermDocumentsController } from '#/modules/service-term/document/documents.controller';
import { InternalServiceTermDocumentsController } from '#/modules/service-term/document/documents-internal.controller';
import { GetInternalServiceTermsHandler } from '#/modules/service-term/document/get-internal-service-terms.handler';
import { GetServiceTermHandler } from '#/modules/service-term/document/get-service-term.handler';
import { GetServiceTermsHandler } from '#/modules/service-term/document/get-service-terms.handler';
import { PublishInternalServiceTermHandler } from '#/modules/service-term/document/publish-internal-service-term.handler';
import { UpdateInternalServiceTermHandler } from '#/modules/service-term/document/update-internal-service-term.handler';

@Module({
  imports: [CqrsModule],
  controllers: [ServiceTermDocumentsController, InternalServiceTermDocumentsController],
  providers: [GetServiceTermsHandler, GetServiceTermHandler, GetInternalServiceTermsHandler, CreateInternalServiceTermHandler, UpdateInternalServiceTermHandler, DeleteInternalServiceTermHandler, PublishInternalServiceTermHandler],
})
export class ServiceTermDocumentsModule {}
