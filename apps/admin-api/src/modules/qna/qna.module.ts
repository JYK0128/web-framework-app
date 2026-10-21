import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { QnaController } from '~/modules/qna/qna.controller';

@Module({ imports: [CqrsModule], controllers: [QnaController] }) export class QnaModule {}
