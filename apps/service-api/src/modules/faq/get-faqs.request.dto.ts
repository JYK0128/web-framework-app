import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { Faq, FaqCategory } from '~/core/database/entities/faqs';

const FAQ_SORT_FIELDS = ['sortOrder', 'createdAt'] as const;
type FaqSortKey = (typeof FAQ_SORT_FIELDS)[number];

const GetFaqsRequestDtoBase = QueryRequestDtoFor<Faq>()({
  search: { fields: ['question', 'answer'] },
  sort: { fields: FAQ_SORT_FIELDS, default: ['sortOrder', 'createdAt'] },
  page: {},
});

@ApiSchema({ name: 'GetFaqsRequest' })
export class GetFaqsRequestDto extends GetFaqsRequestDtoBase {
  @ApiPropertyOptional({ enum: FaqCategory, description: 'FAQ 카테고리' })
  @IsOptional()
  @IsEnum(FaqCategory)
  category?: FaqCategory;

  @ApiPropertyOptional({ isArray: true, enum: FAQ_SORT_FIELDS })
  @IsIn(FAQ_SORT_FIELDS, { each: true })
  override sort: FaqSortKey[] = ['sortOrder', 'createdAt'];

  override toQuery() {
    const query = super.toQuery();
    return this.category
      ? { ...query, where: { $and: [query.where, { category: this.category }] } }
      : query;
  }
}
