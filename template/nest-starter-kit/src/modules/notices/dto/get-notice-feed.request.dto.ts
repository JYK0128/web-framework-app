import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, ValidateNested } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { ToNumber } from '#/common/decorators/to-number.decorator';
import { CursorRequestDto, FilterableRequestDto, SortDirection } from '#/common/interfaces';
import { Notice, NoticePriority } from '#/entities/notices/notice.entity';

export const NOTICE_FEED_SORT = ['title', 'priority', 'publishedAt', 'expiresAt', 'createdAt', 'id'] as const;
export type NoticeFeedSortKey = (typeof NOTICE_FEED_SORT)[number];
export class GetNoticeFeedFiltersDto extends FilterableRequestDto<Notice> {
  @ApiEnumOptional({ enum: NoticePriority, isArray: true })
  @IsOptional()
  @ToNumber()
  @IsEnum(NoticePriority, { each: true })
  priorities?: NoticePriority[];

  override toFilterQuery(): ObjectQuery<Notice> {
    if (this.priorities?.length) {
      return { priority: { $in: this.priorities } };
    }
    return {};
  }
}
export class GetNoticeFeedRequestDto extends CursorRequestDto<Notice, NoticeFeedSortKey> {
  override get searchFields(): (keyof Notice)[] {
    return ['title', 'content'];
  }

  @ApiPropertyOptional({ type: () => GetNoticeFeedFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetNoticeFeedFiltersDto)
  override filters = new GetNoticeFeedFiltersDto();

  @ApiPropertyOptional({ isArray: true, enum: NOTICE_FEED_SORT })
  @IsOptional()
  @IsIn(NOTICE_FEED_SORT, { each: true })
  override sort: NoticeFeedSortKey[] = ['priority', 'publishedAt', 'id'];

  @ApiEnumOptional({ isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = ['desc', 'desc', 'asc'];

  override toFilterQuery(): ObjectQuery<Notice> {
    const now = new Date();
    const baseFilters: ObjectQuery<Notice>[] = [
      { publishedAt: { $ne: null, $lte: now } },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ];
    const customFilters = this.filters.toFilterQuery();
    if (Object.keys(customFilters).length > 0) {
      baseFilters.push(customFilters);
    }
    const searchQuery = this.toSearchQuery();
    if (searchQuery) {
      baseFilters.push(searchQuery);
    }
    return { $and: baseFilters };
  }
}
