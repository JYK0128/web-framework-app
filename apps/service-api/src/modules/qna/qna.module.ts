import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateOwnQnaHandler } from '#/modules/qna/create-own-qna.handler';
import { DeleteOwnQnaHandler } from '#/modules/qna/delete-own-qna.handler';
import { DeleteQnaHandler } from '#/modules/qna/delete-qna.handler';
import { GetAllQnaHandler } from '#/modules/qna/get-all-qna.handler';
import { GetAllQnasHandler } from '#/modules/qna/get-all-qnas.handler';
import { GetOwnQnaHandler } from '#/modules/qna/get-own-qna.handler';
import { GetOwnQnasHandler } from '#/modules/qna/get-own-qnas.handler';
import { QnaController } from '#/modules/qna/qna.controller';
import { QnaCreatedWebhookHandler } from '#/modules/qna/qna-created-webhook.handler';
import { QnaInternalController } from '#/modules/qna/qna-internal.controller';
import { UpdateOwnQnaHandler } from '#/modules/qna/update-own-qna.handler';
import { UpdateQnaHandler } from '#/modules/qna/update-qna.handler';
import { SupportModule } from '#/modules/support/support.module';

@Module({ imports: [CqrsModule, SupportModule], controllers: [QnaController, QnaInternalController], providers: [QnaCreatedWebhookHandler, CreateOwnQnaHandler, DeleteOwnQnaHandler, DeleteQnaHandler, GetAllQnaHandler, GetAllQnasHandler, GetOwnQnaHandler, GetOwnQnasHandler, UpdateOwnQnaHandler, UpdateQnaHandler] })
export class QnaModule {}
