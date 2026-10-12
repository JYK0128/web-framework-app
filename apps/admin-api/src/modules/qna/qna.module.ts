import { Module } from '@nestjs/common';

import { QnaController } from './qna.controller';
import { QnaNotificationService } from './qna-notification.service';

@Module({ controllers: [QnaController], providers: [QnaNotificationService] }) export class QnaModule {}
