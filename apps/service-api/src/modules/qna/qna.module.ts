import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';
import { QnaInternalController } from './qna-internal.controller';

@Module({ imports: [CqrsModule], controllers: [QnaController, QnaInternalController], providers: [QnaService] })
export class QnaModule {}
