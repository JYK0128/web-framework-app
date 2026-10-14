import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetTermRevisionsQuery } from '#/modules/service-terms/revisions/get-term-revisions.query';
import { GetTermRevisionsResponseDto } from '#/modules/service-terms/revisions/get-term-revisions.response.dto';
import { TermRevisionItemDto } from '#/modules/service-terms/revisions/term-revision-item.dto';

@Injectable()
@QueryHandler(GetTermRevisionsQuery)
export class GetTermRevisionsHandler implements IQueryHandler<GetTermRevisionsQuery, GetTermRevisionsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetTermRevisionsQuery): Promise<GetTermRevisionsResponseDto> {
    const { groupId, dto } = query.input;
    const result = await this.em.findByPage(Term, { termGroup: groupId, publishedAt: { $ne: null, $lte: new Date() } }, {
      page: dto.page,
      limit: dto.limit,
      orderBy: { publishedAt: 'DESC', id: 'DESC' },
    });
    return GetTermRevisionsResponseDto.parse({
      ...result,
      items: result.items.map((term) => TermRevisionItemDto.parseEntity(term)),
    });
  }
}
