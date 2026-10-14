import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermHandler } from '#/modules/term/document/create-term.handler';
import { DeleteTermHandler } from '#/modules/term/document/delete-term.handler';
import { TermDocumentsController } from '#/modules/term/document/documents.controller';
import { GetTermHandler } from '#/modules/term/document/get-term.handler';
import { GetTermsHandler } from '#/modules/term/document/get-terms.handler';
import { PublishTermHandler } from '#/modules/term/document/publish-term.handler';
import { UpdateTermHandler } from '#/modules/term/document/update-term.handler';

@Module({ imports: [CqrsModule], controllers: [TermDocumentsController], providers: [CreateTermHandler, DeleteTermHandler, GetTermHandler, GetTermsHandler, PublishTermHandler, UpdateTermHandler] })
export class TermDocumentsModule {}
