import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetTermHistoryCursorResponseDto } from '#/modules/terms/dto/get-term-history-cursor.response.dto';
import { TermDto } from '#/modules/terms/dto/term.dto';
import { GetTermHistoryCursorQuery } from '#/modules/terms/queries/get-term-history-cursor.query';

@Injectable()
@QueryHandler(GetTermHistoryCursorQuery)
export class GetTermHistoryCursorHandler implements IQueryHandler<GetTermHistoryCursorQuery, GetTermHistoryCursorResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermHistoryCursorQuery): Promise<GetTermHistoryCursorResponseDto> {
    const input = this.identify(query);
    this.verify(input);
    const cursor = await this.load(input);
    return this.process(cursor);
  }

  private identify(query: GetTermHistoryCursorQuery) {
    return query.input;
  }

  private verify(input: GetTermHistoryCursorQuery['input']): void {
    const { first } = input.toCursorOptions();
    if (first < 1 || first > 100) {
      throw new Error('약관 이력 커서 조회 범위가 올바르지 않습니다.');
    }
  }

  private load(input: GetTermHistoryCursorQuery['input']) {
    return this.em.findByCursor(Term, {
      where: input.toFilterQuery(),
      ...input.toCursorOptions(),
      populate: ['termGroup'],
    });
  }

  private process(cursor: Awaited<ReturnType<GetTermHistoryCursorHandler['load']>>): GetTermHistoryCursorResponseDto {
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
