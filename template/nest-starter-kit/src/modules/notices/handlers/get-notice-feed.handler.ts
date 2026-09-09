import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SessionContext } from '#/common/contexts/session.context';
import { Notice } from '#/entities/notices/notice.entity';
import { NoticeRead } from '#/entities/notices/notice-read.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetNoticeFeedRequestDto, GetNoticeFeedResponseDto, NoticeFeedItemDto } from '#/modules/notices/dto';
import { GetNoticeFeedQuery } from '#/modules/notices/queries/get-notice-feed.query';

@Injectable()
@QueryHandler(GetNoticeFeedQuery)
export class GetNoticeFeedHandler implements IQueryHandler<GetNoticeFeedQuery, GetNoticeFeedResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(query: GetNoticeFeedQuery): Promise<GetNoticeFeedResponseDto> {
    const cursor = await this.identifyNotices(query.input);
    const reads = await this.identifyReads(this.sessionContext.user?.id, cursor.items);
    this.verify(cursor, reads);

    return this.process(cursor, reads);
  }

  private verify(
    cursor: Awaited<ReturnType<GetNoticeFeedHandler['identifyNotices']>>,
    reads: NoticeRead[],
  ): void {
    if (!Array.isArray(cursor.items) || !Array.isArray(reads)) {
      throw new Error('공지 피드를 확인할 수 없습니다.');
    }
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
