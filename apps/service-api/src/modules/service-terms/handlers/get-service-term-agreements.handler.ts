import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ServiceTermAgreementItemDto, ServiceTermAgreementListResponseDto } from '#/modules/service-terms/dto';
import { GetServiceTermAgreementsQuery } from '#/modules/service-terms/queries';

import { isPublished, latestPublishedTerms } from './service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermAgreementsQuery)
export class GetServiceTermAgreementsHandler implements IQueryHandler<GetServiceTermAgreementsQuery, ServiceTermAgreementListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermAgreementsQuery): Promise<ServiceTermAgreementListResponseDto> {
    const terms = latestPublishedTerms((await this.em.find(Term, {}, { populate: ['termGroup'] })).filter(isPublished));
    const agreements = await this.em.find(UserTermAgreement, { user: query.input.userId }, { populate: ['term'], orderBy: { createdAt: 'desc', id: 'desc' } });
    const agreementsByTermId = new Map<string, UserTermAgreement>();
    for (const agreement of agreements) {
      if (!agreementsByTermId.has(agreement.term.id)) agreementsByTermId.set(agreement.term.id, agreement);
    }
    const items = terms.map((term) => ServiceTermAgreementItemDto.from(term, agreementsByTermId.get(term.id)));
    return ServiceTermAgreementListResponseDto.fromPlain({ items });
  }
}
