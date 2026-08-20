import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { GetNoticesResponseDto, NoticeItemDto } from '#/modules/notices/dto';
import { GetPublishedNoticesQuery } from '#/modules/notices/queries/get-published-notices.query';

@Injectable()
@QueryHandler(GetPublishedNoticesQuery)
export class GetPublishedNoticesHandler implements IQueryHandler<GetPublishedNoticesQuery, GetNoticesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetPublishedNoticesQuery): Promise<GetNoticesResponseDto> {
    const notices = await this.identifyPublishedNotices();
    return this.process(notices);
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
    return { notices: notices.map((notice) => new NoticeItemDto(notice)) };
  }
}
