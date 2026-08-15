import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { GetTermHistoryPageResponseDto } from '#/modules/terms/dto/get-term-history-page.response.dto';
import { TermDto } from '#/modules/terms/dto/term.dto';
import { GetTermHistoryPageQuery } from '#/modules/terms/queries/get-term-history-page.query';

@Injectable()
@QueryHandler(GetTermHistoryPageQuery)
export class GetTermHistoryPageHandler implements IQueryHandler<GetTermHistoryPageQuery, GetTermHistoryPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermHistoryPageQuery): Promise<GetTermHistoryPageResponseDto> {
    const page = await this.em.findByPage(Term, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['termGroup'],
    });

    return {
      ...page,
      items: page.items.map((term) => new TermDto(term)),
    };
  }
}
