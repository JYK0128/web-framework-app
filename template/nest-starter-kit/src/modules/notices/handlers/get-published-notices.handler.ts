import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Notice } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetNoticesResponseDto, NoticeItemDto } from '#/modules/notices/dto';
import { GetPublishedNoticesQuery } from '#/modules/notices/queries/get-published-notices.query';

@Injectable()
@QueryHandler(GetPublishedNoticesQuery)
export class GetPublishedNoticesHandler implements IQueryHandler<GetPublishedNoticesQuery, GetNoticesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetPublishedNoticesQuery): Promise<GetNoticesResponseDto> {
    const notices = await this.identifyPublishedNotices();
    this.verify(notices);
    return this.process(notices);
  }

  private verify(notices: Notice[]): void {
    if (!Array.isArray(notices)) {
      throw new Error('게시 공지 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyPublishedNotices(): Promise<Notice[]> {
    return this.em.find(Notice, {
      publishedAt: { $ne: null, $lte: new Date() },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }, {
      orderBy: { priority: 'DESC', publishedAt: 'DESC' },
    });
  }

  private process(notices: Notice[]): GetNoticesResponseDto {
    return { items: notices.map((notice) => new NoticeItemDto(notice)) };
  }
}
