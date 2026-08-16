import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Faq } from '#/entities/faqs/faq.entity';
import { FaqItemDto, GetFaqsRequestDto, GetFaqsResponseDto } from '#/modules/faqs/dto';
import { GetFaqsQuery } from '#/modules/faqs/queries/get-faqs.query';

@Injectable()
@QueryHandler(GetFaqsQuery)
export class GetFaqsHandler implements IQueryHandler<GetFaqsQuery, GetFaqsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetFaqsQuery): Promise<GetFaqsResponseDto> {
    const faqs = await this.identifyFaqs(query.query);
    const categories = await this.identifyCategories();

    return this.process(faqs, categories);
  }

  private async identifyFaqs(query: GetFaqsRequestDto): Promise<Faq[]> {
    const filters: Record<string, unknown> = { isPublished: true };

    if (query.category) {
      filters.category = query.category;
    }

    const searchQuery = query.toSearchQuery();
    const where = searchQuery ? { $and: [filters, searchQuery] } : filters;

    return this.em.find(Faq, where, {
      orderBy: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  private async identifyCategories(): Promise<string[]> {
    const allPublishedFaqs = await this.em.find(Faq, { isPublished: true }, {
      fields: ['category'],
      orderBy: { category: 'ASC' },
    });
    return Array.from(new Set(allPublishedFaqs.map((f) => f.category)));
  }

  private process(faqs: Faq[], categories: string[]): GetFaqsResponseDto {
    return {
      items: faqs.map((faq) => new FaqItemDto(faq)),
      categories,
    };
  }
}
