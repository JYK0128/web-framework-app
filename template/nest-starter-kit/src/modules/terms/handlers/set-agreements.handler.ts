import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { SetAgreementsCommand } from '#/modules/terms/commands/set-agreements.command';
import { SetAgreementsResponseDto } from '#/modules/terms/dto/set-agreements.response.dto';

@Injectable()
@CommandHandler(SetAgreementsCommand)
export class SetAgreementsHandler implements ICommandHandler<SetAgreementsCommand, SetAgreementsResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: SetAgreementsCommand): Promise<SetAgreementsResponseDto> {
    const input = this.identify(command);
    this.verify(input);
    if (input.agreements.length === 0) {
      return { ok: true };
    }

    const userId = this.sessionContext.requiredUser.id;
    const agreementMap = new Map(input.agreements.map(({ id, isAgreed }) => [id, isAgreed]));
    const metadataMap = new Map(input.agreements.map(({ id, metadata }) => [id, metadata]));
    const termIds = [...agreementMap.keys()];

    const terms = await this.identifyTerms(termIds);
    this.verifyTerms(terms, termIds, agreementMap);

    const latestAgreements = await this.identifyLatestAgreements(userId, terms);

    return this.process(userId, terms, agreementMap, metadataMap, latestAgreements);
  }

  private identify(command: SetAgreementsCommand): SetAgreementsCommand['input'] {
    return command.input;
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

  private verify(
    input: SetAgreementsCommand['input'],
  ): void {
    if (!Array.isArray(input.agreements)) {
      throw new ApplicationError({ code: 'VALIDATION_ERROR', status: HttpStatus.BAD_REQUEST });
    }
  }

  private verifyTerms(terms: Term[], termIds: string[], agreementMap: Map<string, boolean>): void {
    this.verifyAllPublished(terms, termIds);
    this.verifyRequiredNotWithdrawn(terms, agreementMap);
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

  private isMetadataEqual(
    a: Record<string, unknown> | null | undefined,
    b: Record<string, unknown> | null | undefined,
  ): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }

  private async process(
    userId: string,
    terms: Term[],
    agreementMap: Map<string, boolean>,
    metadataMap: Map<string, Record<string, unknown> | undefined>,
    latestAgreements: Map<string, UserTermAgreement>,
  ): Promise<SetAgreementsResponseDto> {
    for (const term of terms) {
      const isAgreed = agreementMap.get(term.id) === true;
      const latestAgreement = latestAgreements.get(term.termGroup.id);
      const newMetadata = metadataMap.get(term.id) ?? null;

      if (
        latestAgreement?.isAgreed === isAgreed
        && (!isAgreed || latestAgreement.term.id === term.id)
        && this.isMetadataEqual(latestAgreement.metadata, newMetadata)
      ) {
        continue;
      }

      this.em.persist(this.em.create(UserTermAgreement, {
        user: this.em.getReference(User, userId),
        term,
        isAgreed,
        metadata: newMetadata,
      }));
    }

    return { ok: true };
  }
}
