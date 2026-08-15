import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { FilterableRequestDto, PageRequestDto, SortDirection } from '#/common/interfaces';
import { Faq } from '#/entities/faqs/faq.entity';

export const ADMIN_FAQ_SORT = ['category', 'question', 'order', 'isPublished', 'helpfulCount', 'createdAt', 'updatedAt', 'id'] as const;
export type AdminFaqSortKey = (typeof ADMIN_FAQ_SORT)[number];

export class GetAdminFaqsFiltersDto extends FilterableRequestDto<Faq> {
  @ApiPropertyOptional({ description: '카테고리 필터' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '질문 또는 답변 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  toFilterQuery(): ObjectQuery<Faq> {
    const filters: ObjectQuery<Faq>[] = [];
    const search = this.search?.trim();

    if (search) {
      filters.push({
        $or: [
          { question: { $like: `%${search}%` } },
          { answer: { $like: `%${search}%` } },
        ],
      });
    }

    if (this.category) {
      filters.push({ category: this.category });
    }

    if (filters.length === 0) return {};
    if (filters.length === 1) return filters[0];

    return { $and: filters };
  }
}

export class GetAdminFaqsRequestDto extends PageRequestDto<Faq, AdminFaqSortKey> {
  @ApiPropertyOptional({ type: () => GetAdminFaqsFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetAdminFaqsFiltersDto)
  filters = new GetAdminFaqsFiltersDto();

  @ApiPropertyOptional({ example: ['order', 'createdAt'], isArray: true, enum: ADMIN_FAQ_SORT })
  @IsOptional()
  @IsIn(ADMIN_FAQ_SORT, { each: true })
  sort: AdminFaqSortKey[] = ['order', 'createdAt'];

  @ApiPropertyOptional({ example: ['asc', 'desc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = ['asc', 'desc'];
}
