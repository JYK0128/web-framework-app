import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Faq } from '~/core/database/entities/faqs';
import { FaqItemDto } from '~/modules/faq/faq-item.dto';
import { GetFaqsQuery } from '~/modules/faq/get-faqs.query';
import { GetPublicFaqsResponseDto } from '~/modules/faq/get-public-faqs.response.dto';

@Injectable()
@QueryHandler(GetFaqsQuery)
export class GetFaqsHandler implements IQueryHandler<GetFaqsQuery, GetPublicFaqsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetFaqsQuery): Promise<GetPublicFaqsResponseDto> {
    const { input } = query;
    const { where, ...options } = input.toQuery();
    const result = await this.em.findByCursor(Faq, {
      ...options,
      where: { $and: [{ isPublished: true }, where] },
    });
    const categories = await this.em.find(Faq, { isPublished: true }, { fields: ['category'], orderBy: { category: 'ASC' } });
    return GetPublicFaqsResponseDto.parse({
      ...result,
      items: result.items.map((faq) => FaqItemDto.parseEntity(faq)),
      categories: [...new Set(categories.map((faq) => faq.category))],
    });
  }
}
