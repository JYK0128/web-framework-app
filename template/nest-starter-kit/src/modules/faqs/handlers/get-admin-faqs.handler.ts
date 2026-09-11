import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Faq } from '#/entities/faqs/faq.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetAdminFaqsRequestDto, GetAdminFaqsResponseDto } from '#/modules/faqs/dto';
import { GetAdminFaqsQuery } from '#/modules/faqs/queries/get-admin-faqs.query';

@Injectable()
@QueryHandler(GetAdminFaqsQuery)
export class GetAdminFaqsHandler implements IQueryHandler<GetAdminFaqsQuery, GetAdminFaqsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminFaqsQuery): Promise<GetAdminFaqsResponseDto> {
    const pageResult = await this.identifyFaqs(query.input);
    this.verify(pageResult);
    return this.process(pageResult);
  }

  private verify(pageResult: PageResult<Faq>): void {
    if (!Array.isArray(pageResult.items)) {
      throw new Error('FAQ 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyFaqs(query: GetAdminFaqsRequestDto): Promise<PageResult<Faq>> {
    return this.em.findByPage(Faq, query.toFilterQuery(), query.toPageOptions());
  }

  private process(pageResult: PageResult<Faq>): GetAdminFaqsResponseDto {
    return GetAdminFaqsResponseDto.fromPlain(pageResult);
  }
}
