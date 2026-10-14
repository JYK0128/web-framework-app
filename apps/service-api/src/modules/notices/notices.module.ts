import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateNoticeHandler } from '#/modules/notices/create-notice.handler';
import { DeleteNoticeHandler } from '#/modules/notices/delete-notice.handler';
import { GetNoticeHandler } from '#/modules/notices/get-notice.handler';
import { GetNoticesHandler } from '#/modules/notices/get-notices.handler';
import { GetPublicNoticesHandler } from '#/modules/notices/get-public-notices.handler';
import { InternalNoticesController } from '#/modules/notices/internal-notices.controller';
import { NoticesController } from '#/modules/notices/notices.controller';
import { UpdateNoticeHandler } from '#/modules/notices/update-notice.handler';

@Module({
  imports: [CqrsModule],
  controllers: [NoticesController, InternalNoticesController],
  providers: [GetNoticesHandler, GetPublicNoticesHandler, GetNoticeHandler, CreateNoticeHandler, UpdateNoticeHandler, DeleteNoticeHandler],
})
export class NoticesModule {}
