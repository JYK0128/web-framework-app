import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { UpdateAgreementsCommand } from '#/modules/terms/commands/update-agreements.command';
import { UpdateAgreementsResponseDto } from '#/modules/terms/dto/update-agreements.response.dto';

@Injectable()
@CommandHandler(UpdateAgreementsCommand)
export class UpdateAgreementsHandler implements ICommandHandler<UpdateAgreementsCommand, UpdateAgreementsResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: UpdateAgreementsCommand): Promise<UpdateAgreementsResponseDto> {
    const { agreements } = command.input;
    const sessionUser = this.cls.get('user');
    if (!sessionUser) throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.UNAUTHORIZED });

    const agreeIds = agreements.filter((a) => a.isAgreed).map((a) => a.id);
    const withdrawIds = agreements.filter((a) => !a.isAgreed).map((a) => a.id);

    if (withdrawIds.length > 0) {
      await this.handleWithdrawals(sessionUser.id, withdrawIds);
    }

    if (agreeIds.length > 0) {
      await this.handleAgreements(sessionUser.id, agreeIds);
    }

    await this.em.flush();
    return { ok: true };
  }

  private async handleWithdrawals(userId: string, termIds: string[]): Promise<void> {
    const terms = await this.em.find(Term, { id: { $in: termIds } }, { populate: ['termGroup'] });
    const hasRequired = terms.some((t) => t.termGroup.isRequired);
    if (hasRequired) {
      throw new ApplicationError({ code: 'CANNOT_WITHDRAW_REQUIRED_TERM', status: HttpStatus.BAD_REQUEST });
    }

    const agreements = await this.em.find(UserTermAgreement, {
      user: userId,
      term: { id: { $in: termIds } },
    });

    if (agreements.length > 0) {
      this.em.remove(agreements);
    }
  }

  private async handleAgreements(userId: string, termIds: string[]): Promise<void> {
    const terms = await this.em.find(
      Term,
      { id: { $in: termIds }, publishedAt: { $ne: null, $lte: new Date() } },
      { populate: ['termGroup'] },
    );

    if (terms.length !== termIds.length) {
      throw new ApplicationError({ code: 'NO_PUBLISHED_TERM', status: HttpStatus.BAD_REQUEST });
    }

    const agreements = await this.em.find(UserTermAgreement, {
      user: userId,
      term: { termGroup: { $in: terms.map((t) => t.termGroup.id) } },
    }, { populate: ['term', 'term.termGroup'] });

    const agreementMap = new Map<string, UserTermAgreement>();
    for (const a of agreements) {
      agreementMap.set(a.term.termGroup.id, a);
    }

    for (const term of terms) {
      const prev = agreementMap.get(term.termGroup.id);

      if (prev) {
        if (prev.term.id === term.id) continue;
        this.em.remove(prev);
      }

      const next = this.em.create(UserTermAgreement, {
        user: this.em.getReference(User, userId),
        term,
        agreedAt: new Date(),
      });
      this.em.persist(next);
    }
  }
}
