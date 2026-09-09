import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetTermHistoryPageResponseDto } from '#/modules/terms/dto/get-term-history-page.response.dto';
import { TermDto } from '#/modules/terms/dto/term.dto';
import { GetTermHistoryPageQuery } from '#/modules/terms/queries/get-term-history-page.query';

@Injectable()
@QueryHandler(GetTermHistoryPageQuery)
export class GetTermHistoryPageHandler implements IQueryHandler<GetTermHistoryPageQuery, GetTermHistoryPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermHistoryPageQuery): Promise<GetTermHistoryPageResponseDto> {
    const input = this.identify(query);
    this.verify(input);
    const page = await this.load(input);
    return this.process(page);
  }

  private identify(query: GetTermHistoryPageQuery) {
    return query.input;
  }

  private verify(input: GetTermHistoryPageQuery['input']): void {
    const { page, limit } = input.toPageOptions();
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('약관 이력 페이지 조회 범위가 올바르지 않습니다.');
    }
  }

  private load(input: GetTermHistoryPageQuery['input']) {
    return this.em.findByPage(Term, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['termGroup'],
    });
  }

  private process(page: Awaited<ReturnType<GetTermHistoryPageHandler['load']>>): GetTermHistoryPageResponseDto {
    return {
      ...page,
      items: page.items.map((term) => new TermDto(term)),
    };
  }
}
