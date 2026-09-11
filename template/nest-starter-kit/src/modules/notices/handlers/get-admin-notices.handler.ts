import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Notice } from '#/entities/notices/notice.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetAdminNoticesRequestDto, GetAdminNoticesResponseDto } from '#/modules/notices/dto';
import { NoticeItemDto } from '#/modules/notices/dto/notice-item.dto';
import { GetAdminNoticesQuery } from '#/modules/notices/queries/get-admin-notices.query';

@Injectable()
@QueryHandler(GetAdminNoticesQuery)
export class GetAdminNoticesHandler implements IQueryHandler<GetAdminNoticesQuery, GetAdminNoticesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminNoticesQuery): Promise<GetAdminNoticesResponseDto> {
    const pageResult = await this.identifyNotices(query.input);
    this.verify(pageResult);
    return this.process(pageResult);
  }

  private verify(pageResult: PageResult<Notice>): void {
    if (!Array.isArray(pageResult.items)) {
      throw new Error('공지 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyNotices(query: GetAdminNoticesRequestDto): Promise<PageResult<Notice>> {
    return this.em.findByPage(Notice, query.toFilterQuery(), {
      ...query.toPageOptions(),
      filters: false,
    });
  }

  private process(pageResult: PageResult<Notice>): GetAdminNoticesResponseDto {
    return GetAdminNoticesResponseDto.fromPlain({
      ...pageResult,
      items: pageResult.items.map((notice): NoticeItemDto => ({
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
      })),
    });
  }
}
