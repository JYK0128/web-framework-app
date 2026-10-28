import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Term, UserTermAgreement } from '~/core/database/entities/terms';
import { GetServiceTermAgreementsQuery } from '~/modules/service-term/agreement/get-service-term-agreements.query';
import { GetServiceTermAgreementsResponseDto } from '~/modules/service-term/agreement/get-service-term-agreements.response.dto';
import { ServiceTermAgreementItemDto } from '~/modules/service-term/agreement/service-term-agreement-item.dto';
import { isPublished, latestPublishedTerms } from '~/modules/service-term/service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermAgreementsQuery)
export class GetServiceTermAgreementsHandler implements IQueryHandler<GetServiceTermAgreementsQuery, GetServiceTermAgreementsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermAgreementsQuery): Promise<GetServiceTermAgreementsResponseDto> {
    const terms = latestPublishedTerms((await this.em.find(Term, {}, { populate: ['termGroup'] })).filter(isPublished));
    const agreements = await this.em.find(UserTermAgreement, { user: query.input.userId }, { populate: ['term'], orderBy: { createdAt: 'desc', id: 'desc' } });
    const agreementsByTermId = new Map<string, UserTermAgreement>();
    for (const agreement of agreements) {
      if (!agreementsByTermId.has(agreement.term.id)) agreementsByTermId.set(agreement.term.id, agreement);
    }
    const items = terms.map((term) => ServiceTermAgreementItemDto.parseEntity(term, agreementsByTermId.get(term.id)));
    return GetServiceTermAgreementsResponseDto.parse({ items });
  }
}
