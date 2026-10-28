import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ApiEnumOptional } from '@pkg/server-core/http/decorators';
import { QueryRequestDtoFor, SortDirection } from '@pkg/server-core/http/dto/request';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { Faq, FaqCategory } from '~/core/database/entities/faqs';

const FAQ_SORT_FIELDS = ['sortOrder', 'createdAt'] as const;
type FaqSortKey = (typeof FAQ_SORT_FIELDS)[number];

const GetPublicFaqsRequestDtoBase = QueryRequestDtoFor<Faq>()({
  search: { fields: ['question', 'answer'] },
  sort: { fields: FAQ_SORT_FIELDS, default: ['sortOrder', 'createdAt'] },
  cursor: {},
});

@ApiSchema({ name: 'GetPublicFaqsRequest' })
export class GetPublicFaqsRequestDto extends GetPublicFaqsRequestDtoBase {
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

  override toQuery() {
    const query = super.toQuery();
    return this.category
      ? { ...query, where: { $and: [query.where, { category: this.category }] } }
      : query;
  }
}
