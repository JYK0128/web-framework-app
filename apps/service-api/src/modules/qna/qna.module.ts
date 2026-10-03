import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SupportModule } from '#/modules/support/support.module';

import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';
import { QnaCreatedHandler } from './qna-created.handler';
import { CreateOwnQnaHandler, DeleteOwnQnaHandler, DeleteQnaHandler, GetAllQnaHandler, GetAllQnasHandler, GetOwnQnaHandler, GetOwnQnasHandler, UpdateOwnQnaHandler, UpdateQnaHandler } from './qna-cqrs.handler';
import { QnaInternalController } from './qna-internal.controller';

@Module({ imports: [CqrsModule, SupportModule], controllers: [QnaController, QnaInternalController], providers: [QnaService, QnaCreatedHandler, CreateOwnQnaHandler, DeleteOwnQnaHandler, DeleteQnaHandler, GetAllQnaHandler, GetAllQnasHandler, GetOwnQnaHandler, GetOwnQnasHandler, UpdateOwnQnaHandler, UpdateQnaHandler] })
export class QnaModule {}
