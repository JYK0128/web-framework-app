import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { NoticeItemDto } from '#/modules/notices/dto';
import { GetAdminNoticeQuery } from '#/modules/notices/queries/get-admin-notice.query';

@Injectable()
@QueryHandler(GetAdminNoticeQuery)
export class GetAdminNoticeHandler implements IQueryHandler<GetAdminNoticeQuery, NoticeItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminNoticeQuery): Promise<NoticeItemDto> {
    const notice = await this.identifyNotice(query.input.id);
    return this.process(notice);
  }

  private async identifyNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private process(notice: Notice): NoticeItemDto {
    return new NoticeItemDto(notice);
  }
}
