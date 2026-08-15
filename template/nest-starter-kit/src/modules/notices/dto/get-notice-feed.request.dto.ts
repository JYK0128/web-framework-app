import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { CursorRequestDto, SortDirection } from '#/common/interfaces';
import { Notice, NOTICE_PRIORITIES, type NoticePriority } from '#/entities/notices/notice.entity';

export const NOTICE_FEED_SORT = ['title', 'priority', 'publishedAt', 'expiresAt', 'createdAt', 'id'] as const;
export type NoticeFeedSortKey = (typeof NOTICE_FEED_SORT)[number];

export class GetNoticeFeedFiltersDto {
  @ApiPropertyOptional({ description: '공지 제목 또는 내용 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: NOTICE_PRIORITIES, isArray: true, description: '우선순위 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsIn(NOTICE_PRIORITIES, { each: true })
  priorities?: NoticePriority[];

  toFilterQuery(): ObjectQuery<Notice> {
    const search = this.search?.trim();
    const filters: ObjectQuery<Notice>[] = [];

    if (search) {
      filters.push({
        $or: [
          { title: { $like: `%${search}%` } },
          { content: { $like: `%${search}%` } },
        ],
      });
    }

    if (this.priorities?.length) {
      filters.push({ priority: { $in: this.priorities } });
    }

    if (filters.length === 0) return {};
    if (filters.length === 1) return filters[0];

    return { $and: filters };
  }
}

export class GetNoticeFeedRequestDto extends CursorRequestDto<Notice, NoticeFeedSortKey> {
  @ApiPropertyOptional({ type: () => GetNoticeFeedFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetNoticeFeedFiltersDto)
  filters = new GetNoticeFeedFiltersDto();

  @ApiPropertyOptional({ example: ['priority', 'publishedAt', 'id'], isArray: true, enum: NOTICE_FEED_SORT })
  @IsOptional()
  @IsIn(NOTICE_FEED_SORT, { each: true })
  sort: NoticeFeedSortKey[] = ['priority', 'publishedAt', 'id'];

  @ApiPropertyOptional({ example: ['desc', 'desc', 'asc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = ['desc', 'desc', 'asc'];

  override toFilterQuery(): ObjectQuery<Notice> {
    const now = new Date();
    const filters: ObjectQuery<Notice>[] = [
      { publishedAt: { $ne: null, $lte: now } },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ];
    const searchFilter = this.filters.toFilterQuery();

    if (Object.keys(searchFilter).length > 0) filters.push(searchFilter);
    return { $and: filters };
  }
}
