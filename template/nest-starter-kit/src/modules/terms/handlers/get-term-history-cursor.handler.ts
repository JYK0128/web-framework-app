import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { GetTermHistoryCursorResponseDto } from '#/modules/terms/dto/get-term-history-cursor.response.dto';
import { TermDto } from '#/modules/terms/dto/term.dto';
import { GetTermHistoryCursorQuery } from '#/modules/terms/queries/get-term-history-cursor.query';

@Injectable()
@QueryHandler(GetTermHistoryCursorQuery)
export class GetTermHistoryCursorHandler implements IQueryHandler<GetTermHistoryCursorQuery, GetTermHistoryCursorResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermHistoryCursorQuery): Promise<GetTermHistoryCursorResponseDto> {
    const cursor = await this.em.findByCursor(Term, {
      where: query.input.toFilterQuery(),
      ...query.input.toCursorOptions(),
      populate: ['termGroup'],
    });

    return {
      items: cursor.items.map((term) => new TermDto(term)),
      startCursor: cursor.startCursor,
      endCursor: cursor.endCursor,
      hasNextPage: cursor.hasNextPage,
      hasPrevPage: cursor.hasPrevPage,
      totalCount: cursor.totalCount,
    };
  }
}
