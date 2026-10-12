import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { ServiceTermItemDto, ServiceTermPageResponseDto } from '#/modules/service-terms/dto';
import { GetServiceTermsQuery } from '#/modules/service-terms/queries';

import { isPublished, latestPublishedTerms } from './service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermsQuery)
export class GetServiceTermsHandler implements IQueryHandler<GetServiceTermsQuery, ServiceTermPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermsQuery): Promise<ServiceTermPageResponseDto> {
    const terms = latestPublishedTerms((await this.em.find(Term, {}, { populate: ['termGroup'] })).filter(isPublished));
    const { page, limit } = query.input;
    const items = terms.slice((page - 1) * limit, page * limit);
    const totalCount = terms.length;
    const totalPages = Math.ceil(totalCount / limit);
    return ServiceTermPageResponseDto.parse({ items: items.map((item) => ServiceTermItemDto.parseEntity(item)), page, totalPages, totalCount, hasNextPage: page < totalPages, hasPrevPage: page > 1 && totalCount > 0 });
  }
}
