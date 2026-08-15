import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { FilterableRequestDto, PageRequestDto, SortDirection } from '#/common/interfaces';
import { Notice } from '#/entities/notices/notice.entity';

export const ADMIN_NOTICE_SORT = ['title', 'isPinned', 'priority', 'publishedAt', 'expiresAt', 'createdAt', 'updatedAt', 'id'] as const;
export type AdminNoticeSortKey = (typeof ADMIN_NOTICE_SORT)[number];

export class GetAdminNoticesFiltersDto extends FilterableRequestDto<Notice> {
  @ApiPropertyOptional({ description: '공지 제목 또는 내용 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  toFilterQuery(): ObjectQuery<Notice> {
    const search = this.search?.trim();
    if (!search) return {};

    return {
      $or: [
        { title: { $like: `%${search}%` } },
        { content: { $like: `%${search}%` } },
      ],
    };
  }
}

export class GetAdminNoticesRequestDto extends PageRequestDto<Notice, AdminNoticeSortKey> {
  @ApiPropertyOptional({ type: () => GetAdminNoticesFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetAdminNoticesFiltersDto)
  filters = new GetAdminNoticesFiltersDto();

  @ApiPropertyOptional({ example: ['createdAt'], isArray: true, enum: ADMIN_NOTICE_SORT })
  @IsOptional()
  @IsIn(ADMIN_NOTICE_SORT, { each: true })
  sort: AdminNoticeSortKey[] = ['createdAt'];

  @ApiPropertyOptional({ example: ['desc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = ['desc'];
}
