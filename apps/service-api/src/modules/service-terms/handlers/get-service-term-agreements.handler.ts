import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetServiceTermAgreementsResponseDto } from '#/modules/service-terms/dto';
import { GetServiceTermAgreementsQuery } from '#/modules/service-terms/queries';

import { agreementFor, isPublished, latestPublishedTerms } from './service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermAgreementsQuery)
export class GetServiceTermAgreementsHandler implements IQueryHandler<GetServiceTermAgreementsQuery, GetServiceTermAgreementsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermAgreementsQuery): Promise<GetServiceTermAgreementsResponseDto> {
    const terms = latestPublishedTerms((await this.em.find(Term, {}, { populate: ['termGroup'] })).filter(isPublished));
    const agreements = await this.em.find(UserTermAgreement, { user: query.input.userId }, { populate: ['term'] });
    const agreementsByTermId = new Map(agreements.map((agreement) => [agreement.term.id, agreement]));
    const items = terms.map((term) => {
      const agreement = agreementsByTermId.get(term.id);
      return {
        termId: term.id,
        groupId: term.termGroup.id,
        title: term.termGroup.title,
        version: term.version,
        isRequired: term.termGroup.isRequired,
        isAgreed: agreementFor(term, agreement),
        agreedAt: agreement?.updatedAt ?? null,
      };
    });
    return GetServiceTermAgreementsResponseDto.fromPlain({ items });
  }
}
