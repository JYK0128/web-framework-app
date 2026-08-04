import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';

import { Session as AuthSession } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';
import { TurnOff2FACommand } from '#/modules/auth/commands/turn-off-2fa.command';

@Injectable()
@CommandHandler(TurnOff2FACommand)
export class TurnOff2FAHandler implements ICommandHandler<TurnOff2FACommand, void> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: TurnOff2FACommand): Promise<void> {
    const user = await this.em.findOne(User, { id: command.user.id });
    if (!user) {
      throw new BadRequestException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (!user.isTwoFactorAuthEnabled) {
      throw new BadRequestException({ code: 'TWO_FACTOR_NOT_ENABLED', message: '2FA is not enabled' });
    }

    user.isTwoFactorAuthEnabled = false;
    user.twoFactorAuthSecret = null;

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
