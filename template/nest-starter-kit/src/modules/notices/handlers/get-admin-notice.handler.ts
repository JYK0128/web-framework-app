import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Notice } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetAdminNoticeResponseDto } from '#/modules/notices/dto';
import { GetAdminNoticeQuery } from '#/modules/notices/queries/get-admin-notice.query';

@Injectable()
@QueryHandler(GetAdminNoticeQuery)
export class GetAdminNoticeHandler implements IQueryHandler<GetAdminNoticeQuery, GetAdminNoticeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminNoticeQuery): Promise<GetAdminNoticeResponseDto> {
    const notice = await this.identifyNotice(query.input.id);
    this.verify(notice);
    return this.process(notice);
  }

  private verify(notice: Notice): void {
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }

  private async identifyNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private process(notice: Notice): GetAdminNoticeResponseDto {
    return GetAdminNoticeResponseDto.fromPlain({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      publishedAt: notice.publishedAt,
      expiresAt: notice.expiresAt,
      status: notice.status,
      isPublished: notice.isPublished,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
    });
  }
}
