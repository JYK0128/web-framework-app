import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { FilterableRequestDto, PageRequestDto, SortDirection } from '#/common/interfaces';
import { Term } from '#/entities/terms/term.entity';

export const ADMIN_TERM_SORT = ['publishedAt', 'createdAt', 'version', 'id'] as const;
export type AdminTermSortKey = (typeof ADMIN_TERM_SORT)[number];

export class GetAdminTermsFiltersDto extends FilterableRequestDto<Term> {
  toFilterQuery(): ObjectQuery<Term> {
    return {};
  }
}

export class GetAdminTermsRequestDto extends PageRequestDto<Term, AdminTermSortKey> {
  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }

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
    const parentQuery = super.toFilterQuery();
    return this.groupId ? { $and: [parentQuery, { termGroup: this.groupId }] } : parentQuery;
  }
}
