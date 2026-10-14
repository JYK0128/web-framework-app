import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GetTermRevisionsHandler } from '#/modules/terms/revisions/get-term-revisions.handler';
import { TermRevisionsController } from '#/modules/terms/revisions/revisions.controller';

@Module({ imports: [CqrsModule], controllers: [TermRevisionsController], providers: [GetTermRevisionsHandler] })
export class TermRevisionsModule {}
