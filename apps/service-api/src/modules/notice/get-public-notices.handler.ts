import { type FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Notice } from '~/core/database/entities/notices';
import { GetPublicNoticesQuery } from '~/modules/notice/get-public-notices.query';
import { GetPublicNoticesResponseDto } from '~/modules/notice/get-public-notices.response.dto';
import { NoticeItemDto } from '~/modules/notice/notice-item.dto';

@Injectable()
@QueryHandler(GetPublicNoticesQuery)
export class GetPublicNoticesHandler implements IQueryHandler<GetPublicNoticesQuery, GetPublicNoticesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetPublicNoticesQuery): Promise<GetPublicNoticesResponseDto> {
    const { where, ...options } = input.toQuery();
    const filters: FilterQuery<Notice>[] = [where, { publishedAt: { $ne: null, $lte: new Date() } }];
    if (input.importance) filters.push({ importance: input.importance });
    const result = await this.em.findByCursor(Notice, {
      ...options,
      where: { $and: filters },
      orderBy: { isPinned: 'DESC', importanceOrder: 'ASC', publicationOrder: 'DESC', id: 'ASC' },
    });
    return GetPublicNoticesResponseDto.parse({ ...result, startCursor: result.startCursor, endCursor: result.endCursor, items: result.items.map((item) => NoticeItemDto.parseEntity(item)) });
  }
}
