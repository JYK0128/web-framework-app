import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';
import { verifySync } from 'otplib';

import { Session as AuthSession } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';
import { TurnOn2FACommand } from '#/modules/auth/commands/turn-on-2fa.command';

@Injectable()
@CommandHandler(TurnOn2FACommand)
export class TurnOn2FAHandler implements ICommandHandler<TurnOn2FACommand, void> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: TurnOn2FACommand): Promise<void> {
    const user = await this.em.findOne(User, { id: command.user.id });
    if (!user) {
      throw new BadRequestException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (user.isTwoFactorAuthEnabled) {
      throw new BadRequestException({ code: 'TWO_FACTOR_ALREADY_ENABLED', message: '2FA is already enabled' });
    }

    if (!user.twoFactorAuthSecret) {
      throw new BadRequestException({ code: 'TWO_FACTOR_NOT_GENERATED', message: '2FA secret not generated' });
    }

    const isCodeValid = verifySync({
      token: command.input.code,
      secret: user.twoFactorAuthSecret,
    }).valid;

    if (!isCodeValid) {
      throw new BadRequestException({ code: 'INVALID_TWO_FACTOR_CODE', message: 'Invalid 2FA code' });
    }

    user.isTwoFactorAuthEnabled = true;

    const sessionId = this.cls.get('sessionId');
    if (sessionId) {
      const authSession = await this.em.findOne(AuthSession, { token: sessionId });
      if (authSession) {
        authSession.metadata = { ...authSession.metadata, isTwoFactorAuthenticated: true };
      }
    }

    if (this.cls.isActive()) {
      this.cls.set('isTwoFactorAuthenticated', true);
    }

    await this.em.flush();
  }
}
