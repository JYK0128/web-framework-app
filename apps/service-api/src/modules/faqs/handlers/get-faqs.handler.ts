import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { FaqListResponseDto } from '#/modules/faqs/dto';
import { GetFaqsQuery } from '#/modules/faqs/queries';

@Injectable()
@QueryHandler(GetFaqsQuery)
export class GetFaqsHandler implements IQueryHandler<GetFaqsQuery, FaqListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetFaqsQuery): Promise<FaqListResponseDto> {
    const { input } = query;
    const result = await this.em.findByPage(Faq, { $and: [{ isPublished: true }, input.toFilterQuery()] }, input.toPageOptions());
    const categories = await this.em.find(Faq, { isPublished: true }, { fields: ['category'], orderBy: { category: 'ASC' } });
    return FaqListResponseDto.fromPlain({
      ...result,
      items: result.items,
      categories: [...new Set(categories.map((faq) => faq.category))],
    });
  }
}
