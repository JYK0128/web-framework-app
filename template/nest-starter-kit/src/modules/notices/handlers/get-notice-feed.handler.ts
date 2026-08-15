import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { NoticeRead } from '#/entities/notices/notice-read.entity';
import { GetNoticeFeedRequestDto, GetNoticeFeedResponseDto, NoticeFeedItemDto } from '#/modules/notices/dto';
import { GetNoticeFeedQuery } from '#/modules/notices/queries/get-notice-feed.query';

@Injectable()
@QueryHandler(GetNoticeFeedQuery)
export class GetNoticeFeedHandler implements IQueryHandler<GetNoticeFeedQuery, GetNoticeFeedResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetNoticeFeedQuery): Promise<GetNoticeFeedResponseDto> {
    const cursor = await this.identifyNotices(query.query);
    const reads = await this.identifyReads(query.userId, cursor.items);

    return this.process(cursor, reads);
  }

  private async identifyNotices(query: GetNoticeFeedRequestDto) {
    return this.em.findByCursor(Notice, {
      where: query.toFilterQuery(),
      ...query.toCursorOptions(),
    });
  }

  private async identifyReads(userId: string | undefined, notices: Notice[]): Promise<NoticeRead[]> {
    if (!userId || notices.length === 0) return [];
    return this.em.find(NoticeRead, {
      user: userId,
      notice: { $in: notices.map((n) => n.id) },
    });
  }

  private process(
    cursor: Awaited<ReturnType<typeof this.identifyNotices>>,
    reads: NoticeRead[],
  ): GetNoticeFeedResponseDto {
    const readMap = new Map(reads.map((r) => [r.notice.id, r.readAt]));

    return {
      items: cursor.items.map((notice) => new NoticeFeedItemDto(notice, readMap.has(notice.id))),
      startCursor: cursor.startCursor,
      endCursor: cursor.endCursor,
      hasNextPage: cursor.hasNextPage,
      hasPrevPage: cursor.hasPrevPage,
      totalCount: cursor.totalCount,
    };
  }
}
