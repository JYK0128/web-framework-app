import { Module } from '@nestjs/common';

import { QnaController } from './qna.controller';

@Module({ controllers: [QnaController] }) export class QnaModule {}
