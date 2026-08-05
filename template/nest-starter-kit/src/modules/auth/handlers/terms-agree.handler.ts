import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/entities/auth/user.entity';
import { Verification } from '#/entities/auth/verification.entity';
import { Term, TermStatus } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { TermsAgreeCommand } from '#/modules/auth/commands/terms-agree.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(TermsAgreeCommand)
export class TermsAgreeHandler implements ICommandHandler<TermsAgreeCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: TermsAgreeCommand): Promise<UserProfileResponseDto> {
    const { token, agreedTermIds } = command.input;

    const verification = await this.em.findOne(Verification, { value: token });
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    if (verification.expiresAt < new Date()) {
      await this.em.remove(verification).flush();
      throw new ApplicationError({ code: 'TOKEN_EXPIRED', status: HttpStatus.BAD_REQUEST });
    }

    const identifierPrefix = 'terms:';
    if (!verification.identifier.startsWith(identifierPrefix)) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    const userId = verification.identifier.substring(identifierPrefix.length);

    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    // Load requested terms
    const terms = await this.em.find(Term, { id: { $in: agreedTermIds }, status: TermStatus.PUBLISHED }, { populate: ['termGroup'] });
    const foundTermIds = new Set(terms.map((t) => t.id));

    // Check if all requested terms exist and are published
    if (foundTermIds.size !== agreedTermIds.length) {
      throw new ApplicationError({ code: 'INVALID_TERMS', status: HttpStatus.BAD_REQUEST });
    }

    // Check if any REQUIRED terms are missing from the request
    const allRequiredTerms = await this.em.find(
      Term,
      { status: TermStatus.PUBLISHED, termGroup: { isRequired: true } },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );

    const latestRequiredTermsMap = new Map<string, Term>();
    for (const term of allRequiredTerms) {
      if (!latestRequiredTermsMap.has(term.termGroup.id)) {
        latestRequiredTermsMap.set(term.termGroup.id, term);
      }
    }
    const requiredTerms = Array.from(latestRequiredTermsMap.values());

    const existingAgreements = await this.em.find(UserTermAgreement, { user: userId }, { populate: ['term'] });
    const existingAgreedIds = new Set(existingAgreements.map((a) => a.term.id));

    const finalAgreedIds = new Set([...existingAgreedIds, ...agreedTermIds]);

    const actuallyMissing = requiredTerms.filter((t) => !finalAgreedIds.has(t.id));

    if (actuallyMissing.length > 0) {
      throw new ApplicationError({ code: 'MISSING_REQUIRED_TERMS', status: HttpStatus.BAD_REQUEST });
    }

    // Create agreements
    const newAgreements = terms
      .filter((t) => !existingAgreedIds.has(t.id)) // Only create if not already agreed
      .map((term) => {
        return this.em.create(UserTermAgreement, {
          user,
          term,
          agreedAt: new Date(),
        });
      });

    if (newAgreements.length > 0) {
      this.em.persist(newAgreements);
    }

    this.em.remove(verification);
    await this.em.flush();

    return new UserProfileResponseDto(user);
  }
}
