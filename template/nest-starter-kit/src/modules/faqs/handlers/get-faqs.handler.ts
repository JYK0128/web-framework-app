import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { FaqItemDto, GetFaqsRequestDto, GetFaqsResponseDto } from '#/modules/faqs/dto';
import { GetFaqsQuery } from '#/modules/faqs/queries/get-faqs.query';

@Injectable()
@QueryHandler(GetFaqsQuery)
export class GetFaqsHandler implements IQueryHandler<GetFaqsQuery, GetFaqsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetFaqsQuery): Promise<GetFaqsResponseDto> {
    const faqs = await this.identifyFaqs(query.query);
    const categories = Array.from(new Set(faqs.map((f) => f.category)));

    return this.process(faqs, categories);
  }

  private async identifyFaqs(query: GetFaqsRequestDto): Promise<Faq[]> {
    const filters: Record<string, unknown> = { isPublished: true };

    if (query.category) {
      filters.category = query.category;
    }

    const searchQuery = query.toSearchQuery();
    const where = searchQuery ? { $and: [filters, searchQuery] } : filters;
    const { orderBy, offset, limit } = query.toListOptions();

    return this.em.find(Faq, where, {
      orderBy: orderBy ?? { order: 'ASC', createdAt: 'DESC' },
      offset,
      limit,
    });
  }

  private process(faqs: Faq[], categories: string[]): GetFaqsResponseDto {
    return {
      items: faqs.map((faq) => new FaqItemDto(faq)),
      categories,
    };
  }
}
