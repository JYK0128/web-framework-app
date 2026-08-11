import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { TwoFactor } from '#/entities/auth/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { TurnOff2FACommand } from '#/modules/auth/commands/2fa-turn-off.command';

@Injectable()
@CommandHandler(TurnOff2FACommand)
export class TurnOff2FAHandler implements ICommandHandler<TurnOff2FACommand, void> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_command: TurnOff2FACommand): Promise<void> {
    const clsUser = this.cls.get('user');
    if (!clsUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: clsUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    if (!user.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ENABLED', status: HttpStatus.BAD_REQUEST });
    }

    user.twoFactorEnabled = false;

    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id });
    if (twoFactor) {
      this.em.remove(twoFactor);
    }

    await this.em.flush();
  }
}
