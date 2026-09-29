import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { FaqListResponseDto } from '#/modules/faqs/dto';
import { GetInternalFaqsQuery } from '#/modules/faqs/queries/get-internal-faqs.query';

@Injectable()
@QueryHandler(GetInternalFaqsQuery)
export class GetInternalFaqsHandler implements IQueryHandler<GetInternalFaqsQuery, FaqListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: GetInternalFaqsQuery): Promise<FaqListResponseDto> {
    const result = await this.em.findByPage(Faq, input.toFilterQuery(), input.toPageOptions());
    const categories = await this.em.find(Faq, {}, { fields: ['category'], orderBy: { category: 'ASC' } });
    return FaqListResponseDto.fromPlain({ ...result, items: result.items, categories: [...new Set(categories.map((faq) => faq.category))] });
  }
}
