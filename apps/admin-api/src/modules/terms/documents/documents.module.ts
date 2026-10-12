import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateTermHandler } from './create-term.handler';
import { DeleteTermHandler } from './delete-term.handler';
import { TermDocumentsController } from './documents.controller';
import { GetTermHandler } from './get-term.handler';
import { GetTermsHandler } from './get-terms.handler';
import { PublishTermHandler } from './publish-term.handler';
import { UpdateTermHandler } from './update-term.handler';

@Module({ imports: [CqrsModule], controllers: [TermDocumentsController], providers: [CreateTermHandler, DeleteTermHandler, GetTermHandler, GetTermsHandler, PublishTermHandler, UpdateTermHandler] })
export class TermDocumentsModule {}
