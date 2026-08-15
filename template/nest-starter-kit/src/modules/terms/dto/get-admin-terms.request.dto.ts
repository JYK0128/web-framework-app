import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { FilterableRequestDto, PageRequestDto, SortDirection } from '#/common/interfaces';
import { Term } from '#/entities/terms/term.entity';

export const ADMIN_TERM_SORT = ['publishedAt', 'createdAt', 'version', 'id'] as const;
export type AdminTermSortKey = (typeof ADMIN_TERM_SORT)[number];

export class GetAdminTermsFiltersDto extends FilterableRequestDto<Term> {
  @ApiPropertyOptional({ description: '약관 버전 또는 내용 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  toFilterQuery(): ObjectQuery<Term> {
    const search = this.search?.trim();
    if (!search) return {};

    return {
      $or: [
        { version: { $like: `%${search}%` } },
        { content: { $like: `%${search}%` } },
      ],
    };
  }
}

export class GetAdminTermsRequestDto extends PageRequestDto<Term, AdminTermSortKey> {
  @ApiPropertyOptional({ description: '약관 그룹 ID' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({ type: () => GetAdminTermsFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetAdminTermsFiltersDto)
  filters = new GetAdminTermsFiltersDto();

  @ApiPropertyOptional({ example: ['createdAt'], isArray: true, enum: ADMIN_TERM_SORT })
  @IsOptional()
  @IsIn(ADMIN_TERM_SORT, { each: true })
  sort: AdminTermSortKey[] = ['createdAt'];

  @ApiPropertyOptional({ example: ['desc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = ['desc'];

  override toFilterQuery(): ObjectQuery<Term> {
    const filters = this.filters.toFilterQuery();
    return this.groupId ? { $and: [filters, { termGroup: this.groupId }] } : filters;
  }
}
