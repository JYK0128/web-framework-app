import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { GetServiceTermsQuery } from '#/modules/service-terms/documents/get-service-terms.query';
import { GetServiceTermsResponseDto } from '#/modules/service-terms/documents/get-service-terms.response.dto';
import { ServiceTermItemDto } from '#/modules/service-terms/documents/service-term-item.dto';
import { isPublished, latestPublishedTerms } from '#/modules/service-terms/service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermsQuery)
export class GetServiceTermsHandler implements IQueryHandler<GetServiceTermsQuery, GetServiceTermsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermsQuery): Promise<GetServiceTermsResponseDto> {
    const terms = latestPublishedTerms((await this.em.find(Term, {}, { populate: ['termGroup'] })).filter(isPublished));
    const { page, limit } = query.input;
    const items = terms.slice((page - 1) * limit, page * limit);
    const totalCount = terms.length;
    const totalPages = Math.ceil(totalCount / limit);
    return GetServiceTermsResponseDto.parse({ items: items.map((item) => ServiceTermItemDto.parseEntity(item)), page, totalPages, totalCount, hasNextPage: page < totalPages, hasPrevPage: page > 1 && totalCount > 0 });
  }
}
