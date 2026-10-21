import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetTermRevisionsHandler } from '~/modules/term/revision/get-term-revisions.handler';
import { TermRevisionsController } from '~/modules/term/revision/revisions.controller';

@Module({ imports: [CqrsModule], controllers: [TermRevisionsController], providers: [GetTermRevisionsHandler] })
export class TermRevisionsModule {}
