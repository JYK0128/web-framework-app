import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { InternalNoticesController } from './internal-notices.controller';
import { NoticesController } from './notices.controller';
import { CreateNoticeHandler, DeleteNoticeHandler, GetNoticeHandler, GetNoticesHandler, GetPublicNoticesHandler, UpdateNoticeHandler } from './notices.handlers';

@Module({
  imports: [CqrsModule],
  controllers: [NoticesController, InternalNoticesController],
  providers: [GetNoticesHandler, GetPublicNoticesHandler, GetNoticeHandler, CreateNoticeHandler, UpdateNoticeHandler, DeleteNoticeHandler],
})
export class NoticesModule {}
