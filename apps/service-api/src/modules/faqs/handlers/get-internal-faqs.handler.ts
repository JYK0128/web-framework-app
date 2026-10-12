import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Faq } from '#/core/database/entities/faqs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { FaqItemDto, FaqPageResponseDto } from '#/modules/faqs/dto';
import { GetInternalFaqsQuery } from '#/modules/faqs/queries/get-internal-faqs.query';

@Injectable()
@QueryHandler(GetInternalFaqsQuery)
export class GetInternalFaqsHandler implements IQueryHandler<GetInternalFaqsQuery, FaqPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: GetInternalFaqsQuery): Promise<FaqPageResponseDto> {
    const result = await this.em.findByPage(Faq, input.toFilterQuery(), input.toPageOptions());
    const categories = await this.em.find(Faq, {}, { fields: ['category'], orderBy: { category: 'ASC' } });
    return FaqPageResponseDto.parse({ ...result, items: result.items.map((faq) => FaqItemDto.parseEntity(faq)), categories: [...new Set(categories.map((faq) => faq.category))] });
  }
}
