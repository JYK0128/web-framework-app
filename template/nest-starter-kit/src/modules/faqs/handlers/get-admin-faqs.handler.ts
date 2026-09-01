import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { FaqItemDto, GetAdminFaqsRequestDto, GetAdminFaqsResponseDto } from '#/modules/faqs/dto';
import { GetAdminFaqsQuery } from '#/modules/faqs/queries/get-admin-faqs.query';

@Injectable()
@QueryHandler(GetAdminFaqsQuery)
export class GetAdminFaqsHandler implements IQueryHandler<GetAdminFaqsQuery, GetAdminFaqsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminFaqsQuery): Promise<GetAdminFaqsResponseDto> {
    const pageResult = await this.identifyFaqs(query.query);
    return this.process(pageResult);
  }

  private async identifyFaqs(query: GetAdminFaqsRequestDto): Promise<PageResult<Faq>> {
    return this.em.findByPage(Faq, query.toFilterQuery(), query.toPageOptions());
  }

  private process(pageResult: PageResult<Faq>): GetAdminFaqsResponseDto {
    return {
      ...pageResult,
      items: pageResult.items.map((faq) => new FaqItemDto(faq)),
    };
  }
}
