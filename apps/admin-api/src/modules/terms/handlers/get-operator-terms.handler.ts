import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetOperatorTermsResponseDto, OperatorTermItemDto } from '#/modules/terms/interfaces';
import { GetOperatorTermsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetOperatorTermsQuery)
export class GetOperatorTermsHandler implements IQueryHandler<GetOperatorTermsQuery, GetOperatorTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorTermsQuery): Promise<GetOperatorTermsResponseDto> {
    const result = await this.em.findByPage(Term, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['termGroup'],
    });

    return GetOperatorTermsResponseDto.fromPlain({
      ...result,
      items: result.items.map((term) => OperatorTermItemDto.from(term)),
    });
  }
}
