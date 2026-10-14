import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermHandler } from '#/modules/terms/documents/create-term.handler';
import { DeleteTermHandler } from '#/modules/terms/documents/delete-term.handler';
import { TermDocumentsController } from '#/modules/terms/documents/documents.controller';
import { GetTermHandler } from '#/modules/terms/documents/get-term.handler';
import { GetTermsHandler } from '#/modules/terms/documents/get-terms.handler';
import { PublishTermHandler } from '#/modules/terms/documents/publish-term.handler';
import { UpdateTermHandler } from '#/modules/terms/documents/update-term.handler';

@Module({ imports: [CqrsModule], controllers: [TermDocumentsController], providers: [CreateTermHandler, DeleteTermHandler, GetTermHandler, GetTermsHandler, PublishTermHandler, UpdateTermHandler] })
export class TermDocumentsModule {}
