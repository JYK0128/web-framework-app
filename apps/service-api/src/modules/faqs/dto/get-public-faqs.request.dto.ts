import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { Faq, FaqCategory } from '#/core/database/entities/faqs';
import { ApiEnumOptional } from '#/core/http/decorators/api-enum.decorator';
import { CursorRequestDto } from '#/core/http/dto/request/cursor.request.dto';
import { SortDirection } from '#/core/http/dto/request/sortable.request.dto';

const FAQ_SORT_FIELDS = ['sortOrder', 'createdAt'] as const;
type FaqSortKey = (typeof FAQ_SORT_FIELDS)[number];

@ApiSchema({ name: 'GetPublicFaqsRequest' })
export class GetPublicFaqsRequestDto extends CursorRequestDto<Faq, FaqSortKey> {
  @ApiPropertyOptional({ enum: FaqCategory, description: 'FAQ 카테고리' })
  @IsOptional()
  @IsEnum(FaqCategory)
  category?: FaqCategory;

  @ApiPropertyOptional({ isArray: true, enum: FAQ_SORT_FIELDS })
  @IsIn(FAQ_SORT_FIELDS, { each: true })
  override sort: FaqSortKey[] = ['sortOrder', 'createdAt'];

  @ApiEnumOptional({ isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = [SortDirection.ASC, SortDirection.DESC];

  override get searchFields(): (keyof Faq)[] {
    return ['question', 'answer'];
  }

  override toFilterQuery() {
    const query = super.toFilterQuery();
    return this.category
      ? { $and: [query, { category: this.category }] }
      : query;
  }
}
