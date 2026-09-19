import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AdminTermItemDto, GetAdminTermsResponseDto } from '#/modules/terms/interfaces';
import { GetAdminTermsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetAdminTermsQuery)
export class GetAdminTermsHandler implements IQueryHandler<GetAdminTermsQuery, GetAdminTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetAdminTermsQuery): Promise<GetAdminTermsResponseDto> {
    const result = await this.em.findByPage(Term, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['termGroup'],
    });

    return GetAdminTermsResponseDto.fromPlain({
      ...result,
      items: result.items.map((term) => AdminTermItemDto.from(term)),
    });
  }
}
