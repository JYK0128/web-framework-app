import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetUserTermsResponseDto, UserTermItemDto } from '#/modules/terms/interfaces';
import { GetUserTermsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetUserTermsQuery)
export class GetUserTermsHandler implements IQueryHandler<GetUserTermsQuery, GetUserTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetUserTermsQuery): Promise<GetUserTermsResponseDto> {
    const result = await this.em.findByPage(Term, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['termGroup'],
    });

    return GetUserTermsResponseDto.fromPlain({
      ...result,
      items: result.items.map((term) => UserTermItemDto.from(term)),
    });
  }
}
