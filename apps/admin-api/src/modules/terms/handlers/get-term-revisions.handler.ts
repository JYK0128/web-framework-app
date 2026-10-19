import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TermRevisionPageResponseDto } from '#/modules/terms/interfaces';
import { GetTermRevisionsQuery } from '#/modules/terms/queries';

@Injectable()
@QueryHandler(GetTermRevisionsQuery)
export class GetTermRevisionsHandler implements IQueryHandler<GetTermRevisionsQuery, TermRevisionPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermRevisionsQuery): Promise<TermRevisionPageResponseDto> {
    const { groupId, dto } = query.input;
    const result = await this.em.findByPage(Term, { termGroup: groupId, publishedAt: { $ne: null, $lte: new Date() } }, {
      page: dto.page,
      limit: dto.limit,
      orderBy: { publishedAt: 'DESC', id: 'DESC' },
    });
    return TermRevisionPageResponseDto.fromPlain({
      ...result,
      items: result.items.map((term) => ({ id: term.id, version: term.version, publishedAt: term.publishedAt, reason: term.reason, summary: term.summary, content: term.content })),
    });
  }
}
