import { Injectable } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetServiceTermAgreementsResponseDto } from '../dto';
import { GetServiceTermAgreementsQuery } from '../queries';
import { agreementFor, isPublished, latestPublishedTerms } from './service-term.helpers';

@Injectable()
@QueryHandler(GetServiceTermAgreementsQuery)
export class GetServiceTermAgreementsHandler implements IQueryHandler<GetServiceTermAgreementsQuery, GetServiceTermAgreementsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(query: GetServiceTermAgreementsQuery): Promise<GetServiceTermAgreementsResponseDto> {
    const terms = latestPublishedTerms((await this.em.find(Term, {}, { populate: ['termGroup'] })).filter(isPublished));
    const agreements = await this.em.find(UserTermAgreement, { user: query.input.userId }, { populate: ['term'] });
    return GetServiceTermAgreementsResponseDto.fromPlain({ items: terms.map((term) => ({ termId: term.id, groupId: term.termGroup.id, title: term.termGroup.title, version: term.version, isRequired: term.termGroup.isRequired, isAgreed: agreementFor(term, agreements.find((agreement) => agreement.term.id === term.id)), agreedAt: agreements.find((agreement) => agreement.term.id === term.id)?.updatedAt ?? null })) });
  }
}
