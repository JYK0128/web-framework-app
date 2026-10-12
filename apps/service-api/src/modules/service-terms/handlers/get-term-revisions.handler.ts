import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { TermRevisionItemDto, TermRevisionPageResponseDto } from '#/modules/service-terms/dto';
import { GetTermRevisionsQuery } from '#/modules/service-terms/queries';

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
    return TermRevisionPageResponseDto.parse({
      ...result,
      items: result.items.map((term) => TermRevisionItemDto.parseEntity(term)),
    });
  }
}
