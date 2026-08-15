import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateNoticeHandler, DeleteNoticeHandler, GetAdminNoticeHandler, GetAdminNoticesHandler, GetNoticeFeedHandler, GetPublishedNoticesHandler, MarkAllNoticesReadHandler, MarkNoticeReadHandler, UpdateNoticeHandler } from './handlers';
import { NoticesController } from './notices.controller';

const Handlers = [
  CreateNoticeHandler,
  UpdateNoticeHandler,
  DeleteNoticeHandler,
  MarkNoticeReadHandler,
  MarkAllNoticesReadHandler,
  GetPublishedNoticesHandler,
  GetNoticeFeedHandler,
  GetAdminNoticesHandler,
  GetAdminNoticeHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [NoticesController],
  providers: [...Handlers],
})
export class NoticesModule {}
