import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager, type PageResult } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { AdminTermDto, GetAdminTermsRequestDto, GetAdminTermsResponseDto } from '#/modules/terms/dto';
import { GetAdminTermsQuery } from '#/modules/terms/queries/get-admin-terms.query';

@Injectable()
@QueryHandler(GetAdminTermsQuery)
export class GetAdminTermsHandler implements IQueryHandler<GetAdminTermsQuery, GetAdminTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminTermsQuery): Promise<GetAdminTermsResponseDto> {
    const pageResult = await this.identify(query.query);
    return this.process(pageResult);
  }

  private async identify(query: GetAdminTermsRequestDto): Promise<PageResult<Term>> {
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
