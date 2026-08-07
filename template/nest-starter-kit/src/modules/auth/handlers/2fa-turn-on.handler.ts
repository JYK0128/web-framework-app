import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';
import { verifySync } from 'otplib';

import { Session as AuthSession } from '#/entities/auth/session.entity';
import { TwoFactor } from '#/entities/auth/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { TurnOn2FACommand } from '#/modules/auth/commands/2fa-turn-on.command';

@Injectable()
@CommandHandler(TurnOn2FACommand)
export class TurnOn2FAHandler implements ICommandHandler<TurnOn2FACommand, void> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: TurnOn2FACommand): Promise<void> {
    const clsUser = this.cls.get('user');
    if (!clsUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: clsUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    if (user.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    }

    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id });
    if (!twoFactor) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_GENERATED', status: HttpStatus.BAD_REQUEST });
    }

    const secret = twoFactor.secret;

    const isCodeValid = verifySync({
      token: command.input.code,
      secret,
    }).valid;

    if (!isCodeValid) {
      throw new ApplicationError({ code: 'INVALID_TWO_FACTOR_CODE', status: HttpStatus.BAD_REQUEST });
    }

    user.twoFactorEnabled = true;

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
