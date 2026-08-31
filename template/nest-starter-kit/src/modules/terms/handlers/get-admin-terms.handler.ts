import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { AdminTermDto, GetAdminTermsRequestDto, GetAdminTermsResponseDto } from '#/modules/terms/dto';
import { GetAdminTermsQuery } from '#/modules/terms/queries/get-admin-terms.query';

@Injectable()
@QueryHandler(GetAdminTermsQuery)
export class GetAdminTermsHandler implements IQueryHandler<GetAdminTermsQuery, GetAdminTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminTermsQuery): Promise<GetAdminTermsResponseDto> {
    const pageResult = await this.identifyTerms(query.query);
    return this.process(pageResult);
  }

  private async identifyTerms(query: GetAdminTermsRequestDto): Promise<PageResult<Term>> {
    return this.em.findByPage(Term, query.toFilterQuery(), {
      ...query.toPageOptions(),
      populate: ['termGroup'],
    });
  }

  private process(pageResult: PageResult<Term>): GetAdminTermsResponseDto {
    return {
      ...pageResult,
      items: pageResult.items.map((term) => new AdminTermDto(term)),
    };
  }
}
