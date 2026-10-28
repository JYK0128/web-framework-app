import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Faq } from '~/core/database/entities/faqs';
import { FaqItemDto } from '~/modules/faq/faq-item.dto';
import { GetFaqsResponseDto } from '~/modules/faq/get-faqs.response.dto';
import { GetInternalFaqsQuery } from '~/modules/faq/get-internal-faqs.query';

@Injectable()
@QueryHandler(GetInternalFaqsQuery)
export class GetInternalFaqsHandler implements IQueryHandler<GetInternalFaqsQuery, GetFaqsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: GetInternalFaqsQuery): Promise<GetFaqsResponseDto> {
    const { where, ...options } = input.toQuery();
    const result = await this.em.findByPage(Faq, where, options);
    const categories = await this.em.find(Faq, {}, { fields: ['category'], orderBy: { category: 'ASC' } });
    return GetFaqsResponseDto.parse({ ...result, items: result.items.map((faq) => FaqItemDto.parseEntity(faq)), categories: [...new Set(categories.map((faq) => faq.category))] });
  }
}
