import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { User } from '#/entities/auth/user.entity';
import { Term, TermStatus } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AgreeOptionalTermCommand } from '#/modules/terms/commands/agree-optional-term.command';
import { AgreeOptionalTermResponseDto } from '#/modules/terms/dto/agree-optional-term.response.dto';

@Injectable()
@CommandHandler(AgreeOptionalTermCommand)
export class AgreeOptionalTermHandler implements ICommandHandler<AgreeOptionalTermCommand, AgreeOptionalTermResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: AgreeOptionalTermCommand): Promise<AgreeOptionalTermResponseDto> {
    const { termGroupId } = command.input;
    const sessionUser = this.cls.get('user');
    if (!sessionUser) throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.UNAUTHORIZED });
    const userId = sessionUser.id;

    const termGroup = await this.em.findOne(TermGroup, { id: termGroupId });
    if (!termGroup) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    const latestTerm = await this.em.findOne(
      Term,
      { termGroup: termGroupId, status: TermStatus.PUBLISHED },
      { orderBy: { publishedAt: 'DESC' } },
    );

    if (!latestTerm) {
      throw new ApplicationError({ code: 'NO_PUBLISHED_TERM', status: HttpStatus.BAD_REQUEST });
    }

    const existing = await this.em.findOne(UserTermAgreement, {
      user: userId,
      term: { termGroup: termGroupId },
    });

    if (existing) {
      if (existing.term.id === latestTerm.id) {
        return { ok: true }; // Already agreed to this latest term
      }
      this.em.remove(existing);
    }

    const newAgreement = this.em.create(UserTermAgreement, {
      user: this.em.getReference(User, userId),
      term: latestTerm,
      agreedAt: new Date(),
    });

    this.em.persist(newAgreement);
    await this.em.flush();

    return { ok: true };
  }
}
