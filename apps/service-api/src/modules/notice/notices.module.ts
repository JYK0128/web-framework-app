import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateNoticeHandler } from '#/modules/notice/create-notice.handler';
import { DeleteNoticeHandler } from '#/modules/notice/delete-notice.handler';
import { GetNoticeHandler } from '#/modules/notice/get-notice.handler';
import { GetNoticesHandler } from '#/modules/notice/get-notices.handler';
import { GetPublicNoticesHandler } from '#/modules/notice/get-public-notices.handler';
import { InternalNoticesController } from '#/modules/notice/internal-notices.controller';
import { NoticesController } from '#/modules/notice/notices.controller';
import { UpdateNoticeHandler } from '#/modules/notice/update-notice.handler';

@Module({
  imports: [CqrsModule],
  controllers: [NoticesController, InternalNoticesController],
  providers: [GetNoticesHandler, GetPublicNoticesHandler, GetNoticeHandler, CreateNoticeHandler, UpdateNoticeHandler, DeleteNoticeHandler],
})
export class NoticesModule {}
