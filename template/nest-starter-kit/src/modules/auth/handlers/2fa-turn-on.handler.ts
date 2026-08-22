import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verifySync } from 'otplib';

import { LOGIN_FAILURE_LOCK_THRESHOLD, LOGIN_LOCK_DURATION_MS } from '#/common/constants/auth.constants';
import { RequestContext } from '#/common/contexts/request.context';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TurnOn2FACommand } from '#/modules/auth/commands/2fa-turn-on.command';

@Injectable()
@CommandHandler(TurnOn2FACommand)
export class TurnOn2FAHandler implements ICommandHandler<TurnOn2FACommand, void> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(command: TurnOn2FACommand): Promise<void> {
    const sessionUser = this.identifySessionUser();

    const twoFactor = await this.identifyPendingTwoFactor(sessionUser.id);
    this.verifyNotLocked(twoFactor);
    await this.verifyCode(twoFactor, command.input.code);

    await this.process(sessionUser.id, twoFactor);
  }

  private identifySessionUser() {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    if (sessionUser.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    }
    return sessionUser;
  }

  private async identifyPendingTwoFactor(userId: string): Promise<TwoFactor> {
    const twoFactor = await this.em.findOne(TwoFactor, { user: userId });
    if (!twoFactor) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_INITIALIZED', status: HttpStatus.BAD_REQUEST });
    }
    return twoFactor;
  }

  private verifyNotLocked(twoFactor: TwoFactor): void {
    if (twoFactor.isLocked) {
      throw new ApplicationError({ code: 'ACCOUNT_LOCKED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async verifyCode(twoFactor: TwoFactor, code: string): Promise<void> {
    const isValid = verifySync({ token: code, secret: twoFactor.secret }).valid;
    if (!isValid) {
      const now = new Date();
      const failedVerificationCount = (twoFactor.failedVerificationCount ?? 0) + 1;
      twoFactor.failedVerificationCount = failedVerificationCount;
      if (failedVerificationCount >= LOGIN_FAILURE_LOCK_THRESHOLD) {
        twoFactor.lockedUntil = new Date(now.getTime() + LOGIN_LOCK_DURATION_MS);
        await this.em.flush();
        throw new ApplicationError({ code: 'ACCOUNT_LOCKED', status: HttpStatus.BAD_REQUEST });
      }

      await this.em.flush();
      throw new ApplicationError({ code: 'INVALID_TWO_FACTOR_CODE', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async process(userId: string, twoFactor: TwoFactor): Promise<void> {
    twoFactor.verified = true;
    twoFactor.failedVerificationCount = 0;
    twoFactor.lockedUntil = null;
    const user = this.em.getReference(User, userId);
    user.twoFactorEnabled = true;
  }
}
