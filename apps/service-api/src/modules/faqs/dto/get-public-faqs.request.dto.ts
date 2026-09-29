import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { CursorRequestDto } from '#/common/interfaces/request/cursor.request.dto';
import { SortDirection } from '#/common/interfaces/request/sortable.request.dto';
import { Faq, FaqCategory } from '#/entities/faqs/faq.entity';

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
