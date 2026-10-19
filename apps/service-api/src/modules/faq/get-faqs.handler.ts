import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Faq } from '#/core/database/entities/faqs';
import { AppEntityManager } from '#/core/database/entity-manager';
import { FaqItemDto } from '#/modules/faq/faq-item.dto';
import { GetFaqsQuery } from '#/modules/faq/get-faqs.query';
import { GetPublicFaqsResponseDto } from '#/modules/faq/get-public-faqs.response.dto';

@Injectable()
@QueryHandler(GetFaqsQuery)
export class GetFaqsHandler implements IQueryHandler<GetFaqsQuery, GetPublicFaqsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetFaqsQuery): Promise<GetPublicFaqsResponseDto> {
    const { input } = query;
    const result = await this.em.findByCursor(Faq, {
      where: { $and: [{ isPublished: true }, input.toFilterQuery()] },
      ...input.toCursorOptions(),
    });
    const categories = await this.em.find(Faq, { isPublished: true }, { fields: ['category'], orderBy: { category: 'ASC' } });
    return GetPublicFaqsResponseDto.parse({
      ...result,
      items: result.items.map((faq) => FaqItemDto.parseEntity(faq)),
      categories: [...new Set(categories.map((faq) => faq.category))],
    });
  }
}
