import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetTermsQuery } from '#/modules/term/document/get-terms.query';
import { GetTermsResponseDto } from '#/modules/term/document/get-terms.response.dto';
import { TermItemDto } from '#/modules/term/document/term-item.dto';

@Injectable()
@QueryHandler(GetTermsQuery)
export class GetTermsHandler implements IQueryHandler<GetTermsQuery, GetTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermsQuery): Promise<GetTermsResponseDto> {
    const result = await this.em.findByPage(Term, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['termGroup'],
    });

    return GetTermsResponseDto.parse({
      ...result,
      items: result.items.map((term) => TermItemDto.parseEntity(term)),
    });
  }
}
