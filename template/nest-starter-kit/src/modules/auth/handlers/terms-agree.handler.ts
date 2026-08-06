import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/entities/auth/user.entity';
import { Verification } from '#/entities/auth/verification.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { TermsAgreeCommand } from '#/modules/auth/commands/terms-agree.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(TermsAgreeCommand)
export class TermsAgreeHandler implements ICommandHandler<TermsAgreeCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: TermsAgreeCommand): Promise<UserProfileResponseDto> {
    const { token, agreements: agreementItems } = command.input;

    const verification = await this.em.findOne(Verification, { value: token });
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    if (verification.isExpired) {
      await this.em.remove(verification).flush();
      throw new ApplicationError({ code: 'TOKEN_EXPIRED', status: HttpStatus.BAD_REQUEST });
    }

    const PREFIX = 'terms:';
    if (!verification.identifier.startsWith(PREFIX)) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    const userId = verification.identifier.substring(PREFIX.length);
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    const termIds = (agreementItems ?? []).filter((a) => a.isAgreed).map((a) => a.id);

    const terms = termIds.length > 0
      ? await this.em.find(
        Term,
        { id: { $in: termIds }, publishedAt: { $ne: null, $lte: new Date() } },
        { populate: ['termGroup'] },
      )
      : [];

    const foundIds = new Set(terms.map((t) => t.id));
    if (foundIds.size !== termIds.length) {
      throw new ApplicationError({ code: 'INVALID_TERMS', status: HttpStatus.BAD_REQUEST });
    }

    const requiredTerms = await this.em.find(
      Term,
      { publishedAt: { $ne: null, $lte: new Date() }, termGroup: { isRequired: true } },
      { populate: ['termGroup'], orderBy: { publishedAt: 'DESC' } },
    );

    const requiredMap = new Map<string, Term>();
    for (const t of requiredTerms) {
      if (!requiredMap.has(t.termGroup.id)) {
        requiredMap.set(t.termGroup.id, t);
      }
    }
    const latestRequired = Array.from(requiredMap.values());

    const existingAgreements = await this.em.find(UserTermAgreement, { user: userId }, { populate: ['term'] });
    const agreedIds = new Set(existingAgreements.map((a) => a.term.id));
    const finalIds = new Set([...agreedIds, ...termIds]);

    const missing = latestRequired.filter((t) => !finalIds.has(t.id));
    if (missing.length > 0) {
      throw new ApplicationError({ code: 'MISSING_REQUIRED_TERMS', status: HttpStatus.BAD_REQUEST });
    }

    const newAgreements = terms
      .filter((t) => !agreedIds.has(t.id))
      .map((term) => this.em.create(UserTermAgreement, { user, term, agreedAt: new Date() }));

    if (newAgreements.length > 0) {
      this.em.persist(newAgreements);
    }

    this.em.remove(verification);
    await this.em.flush();

    return new UserProfileResponseDto(user);
  }
}
