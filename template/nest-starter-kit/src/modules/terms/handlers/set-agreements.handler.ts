import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { SetAgreementsCommand } from '#/modules/terms/commands/set-agreements.command';
import { SetAgreementsResponseDto } from '#/modules/terms/dto/set-agreements.response.dto';

@Injectable()
@CommandHandler(SetAgreementsCommand)
export class SetAgreementsHandler implements ICommandHandler<SetAgreementsCommand, SetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(command: SetAgreementsCommand): Promise<SetAgreementsResponseDto> {
    if (command.input.agreements.length === 0) {
      return { ok: true };
    }

    const userId = this.identifyUserId();
    const agreementMap = new Map(command.input.agreements.map(({ id, isAgreed }) => [id, isAgreed]));
    const termIds = [...agreementMap.keys()];

    const terms = await this.identifyTerms(termIds);
    this.verifyAllPublished(terms, termIds);
    this.verifyRequiredNotWithdrawn(terms, agreementMap);

    const latestAgreements = await this.identifyLatestAgreements(userId, terms);

    return this.process(userId, terms, agreementMap, latestAgreements);
  }

  private identifyUserId(): string {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return sessionUser.id;
  }

  private async identifyTerms(termIds: string[]): Promise<Term[]> {
    return this.em.find(
      Term,
      { id: { $in: termIds }, publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'] },
    );
  }

  private verifyAllPublished(terms: Term[], requestedTermIds: string[]): void {
    if (terms.length !== requestedTermIds.length) {
      throw new ApplicationError({ code: 'NO_PUBLISHED_TERM', status: HttpStatus.BAD_REQUEST });
    }
  }

  private verifyRequiredNotWithdrawn(terms: Term[], agreementMap: Map<string, boolean>): void {
    if (
      terms.some((term) =>
        agreementMap.get(term.id) === false
        && term.termGroup.isRequired)
    ) {
      throw new ApplicationError({ code: 'CANNOT_WITHDRAW_REQUIRED_TERM', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyLatestAgreements(
    userId: string,
    terms: Term[],
  ): Promise<Map<string, UserTermAgreement>> {
    const termGroupIds = terms.map((term) => term.termGroup.id);
    const agreements = await this.em.find(
      UserTermAgreement,
      { user: userId, term: { termGroup: { $in: termGroupIds } } },
      { populate: ['term', 'term.termGroup'], orderBy: { createdAt: 'DESC' } },
    );

    const latest = new Map<string, UserTermAgreement>();
    for (const agreement of agreements) {
      if (!latest.has(agreement.term.termGroup.id)) {
        latest.set(agreement.term.termGroup.id, agreement);
      }
    }
    return latest;
  }

  private async process(
    userId: string,
    terms: Term[],
    agreementMap: Map<string, boolean>,
    latestAgreements: Map<string, UserTermAgreement>,
  ): Promise<SetAgreementsResponseDto> {
    for (const term of terms) {
      const isAgreed = agreementMap.get(term.id) === true;
      const latestAgreement = latestAgreements.get(term.termGroup.id);

      if (
        latestAgreement?.isAgreed === isAgreed
        && (!isAgreed || latestAgreement.term.id === term.id)
      ) {
        continue;
      }

      this.em.persist(this.em.create(UserTermAgreement, {
        user: this.em.getReference(User, userId),
        term,
        isAgreed,
      }));
    }

    return { ok: true };
  }
}
