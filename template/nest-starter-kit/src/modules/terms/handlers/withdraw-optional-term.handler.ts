import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { WithdrawOptionalTermCommand } from '#/modules/terms/commands/withdraw-optional-term.command';
import { WithdrawOptionalTermResponseDto } from '#/modules/terms/dto/withdraw-optional-term.response.dto';

@Injectable()
@CommandHandler(WithdrawOptionalTermCommand)
export class WithdrawOptionalTermHandler implements ICommandHandler<WithdrawOptionalTermCommand, WithdrawOptionalTermResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: WithdrawOptionalTermCommand): Promise<WithdrawOptionalTermResponseDto> {
    const { termGroupId } = command.input;
    const sessionUser = this.cls.get('user');
    if (!sessionUser) throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.UNAUTHORIZED });
    const userId = sessionUser.id;

    const termGroup = await this.em.findOne(TermGroup, { id: termGroupId });
    if (!termGroup) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    if (termGroup.isRequired) {
      throw new ApplicationError({ code: 'CANNOT_WITHDRAW_REQUIRED_TERM', status: HttpStatus.BAD_REQUEST });
    }

    const agreements = await this.em.find(UserTermAgreement, {
      user: userId,
      term: { termGroup: termGroupId },
    });

    if (agreements.length > 0) {
      this.em.remove(agreements);
      await this.em.flush();
    }

    return { ok: true };
  }
}
