import { Injectable } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ServiceTermListResponseDto } from '../dto';
import { GetServiceTermsQuery } from '../queries';
import { isPublished, latestPublishedTerms, toServiceTerm } from './service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermsQuery)
export class GetServiceTermsHandler implements IQueryHandler<GetServiceTermsQuery, ServiceTermListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermsQuery): Promise<ServiceTermListResponseDto> {
    const terms = latestPublishedTerms((await this.em.find(Term, {}, { populate: ['termGroup'] })).filter(isPublished));
    const { page, limit } = query.input;
    const items = terms.slice((page - 1) * limit, page * limit);
    const totalCount = terms.length;
    const totalPages = Math.ceil(totalCount / limit);
    return ServiceTermListResponseDto.fromPlain({ items: items.map(toServiceTerm), page, totalPages, totalCount, hasNextPage: page < totalPages, hasPrevPage: page > 1 && totalCount > 0 });
  }
}
