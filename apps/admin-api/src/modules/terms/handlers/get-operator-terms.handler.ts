import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { OperatorTermItemDto, OperatorTermPageResponseDto } from '#/modules/terms/dto';
import { GetOperatorTermsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetOperatorTermsQuery)
export class GetOperatorTermsHandler implements IQueryHandler<GetOperatorTermsQuery, OperatorTermPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorTermsQuery): Promise<OperatorTermPageResponseDto> {
    const result = await this.em.findByPage(Term, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['termGroup'],
    });

    return OperatorTermPageResponseDto.parse({
      ...result,
      items: result.items.map((term) => OperatorTermItemDto.parseEntity(term)),
    });
  }
}
