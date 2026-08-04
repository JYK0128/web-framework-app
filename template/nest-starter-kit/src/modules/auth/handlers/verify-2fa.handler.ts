import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ClsService } from 'nestjs-cls';
import { verifySync } from 'otplib';

import { Session as AuthSession } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';
import { Verify2FACommand } from '#/modules/auth/commands/verify-2fa.command';

@Injectable()
@CommandHandler(Verify2FACommand)
export class Verify2FAHandler implements ICommandHandler<Verify2FACommand, void> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: Verify2FACommand): Promise<void> {
    const user = await this.em.findOne(User, { id: command.user.id });
    if (!user) {
      throw new BadRequestException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (!user.isTwoFactorAuthEnabled || !user.twoFactorAuthSecret) {
      throw new BadRequestException({ code: 'TWO_FACTOR_NOT_ENABLED', message: '2FA is not enabled for this user' });
    }

    const isCodeValid = verifySync({
      token: command.input.code,
      secret: user.twoFactorAuthSecret,
    }).valid;

    if (!isCodeValid) {
      throw new BadRequestException({ code: 'INVALID_TWO_FACTOR_CODE', message: 'Invalid 2FA code' });
    }

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
  }
}
