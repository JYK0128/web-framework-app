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

  override toFilterQuery(): ObjectQuery<Faq> {
    if (this.category) {
      return { category: this.category };
    }
    return {};
  }
}

export class GetAdminFaqsRequestDto extends PageRequestDto<Faq, AdminFaqSortKey> {
  override get searchFields(): (keyof Faq)[] {
    return ['question', 'answer'];
  }

  @ApiPropertyOptional({ type: () => GetAdminFaqsFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetAdminFaqsFiltersDto)
  override filters = new GetAdminFaqsFiltersDto();

  @ApiPropertyOptional({ example: ['order', 'createdAt'], isArray: true, enum: ADMIN_FAQ_SORT })
  @IsOptional()
  @IsIn(ADMIN_FAQ_SORT, { each: true })
  override sort: AdminFaqSortKey[] = ['order', 'createdAt'];

  @ApiPropertyOptional({ example: ['asc', 'desc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = ['asc', 'desc'];
}
