import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { Faq } from '#/entities/faqs/faq.entity';

const FAQ_SORT_FIELDS = ['sortOrder', 'createdAt'] as const;
type FaqSortKey = (typeof FAQ_SORT_FIELDS)[number];

@ApiSchema({ name: 'GetFaqsRequest' })
export class GetFaqsRequestDto extends PageRequestDto<Faq, FaqSortKey> {
  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;

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
