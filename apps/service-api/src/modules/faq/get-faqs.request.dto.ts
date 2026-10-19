import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { PageRequestDto } from '@pkg/server-core/http/dto/request/page.request.dto';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { Faq, FaqCategory } from '#/core/database/entities/faqs';

const FAQ_SORT_FIELDS = ['sortOrder', 'createdAt'] as const;
type FaqSortKey = (typeof FAQ_SORT_FIELDS)[number];

@ApiSchema({ name: 'GetFaqsRequest' })
export class GetFaqsRequestDto extends PageRequestDto<Faq, FaqSortKey> {
  @ApiPropertyOptional({ enum: FaqCategory, description: 'FAQ 카테고리' })
  @IsOptional()
  @IsEnum(FaqCategory)
  category?: FaqCategory;

  @ApiPropertyOptional({ isArray: true, enum: FAQ_SORT_FIELDS })
  @IsIn(FAQ_SORT_FIELDS, { each: true })
  override sort: FaqSortKey[] = ['sortOrder', 'createdAt'];

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
