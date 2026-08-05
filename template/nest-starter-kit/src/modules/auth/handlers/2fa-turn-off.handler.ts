import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Session as AuthSession } from '#/entities/auth/session.entity';
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
      throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.BAD_REQUEST });
    }

    const user = await this.em.findOne(User, { id: clsUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.BAD_REQUEST });
    }

    if (!user.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ENABLED', status: HttpStatus.BAD_REQUEST });
    }

    user.twoFactorEnabled = false;

    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id });
    if (twoFactor) {
      this.em.remove(twoFactor);
    }

    const sessionId = this.cls.get('sessionId');
    if (sessionId) {
      const authSession = await this.em.findOne(AuthSession, { token: sessionId });
      if (authSession) {
        authSession.metadata = { ...authSession.metadata, isTwoFactorAuthenticated: false };
      }
    }

    if (this.cls.isActive()) {
      this.cls.set('isTwoFactorAuthenticated', false);
    }

    await this.em.flush();
  }
}
