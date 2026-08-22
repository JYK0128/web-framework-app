import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verifySync } from 'otplib';

import { LOGIN_FAILURE_LOCK_THRESHOLD, LOGIN_LOCK_DURATION_MS } from '#/common/constants/auth.constants';
import { SessionContext } from '#/common/contexts/session.context';
import { type VerificationRecord, VerificationStore } from '#/common/stores/verification.store';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { Verify2FAChallengeCommand } from '#/modules/auth/commands/2fa-verify-challenge.command';
import type { TwoFactorVerifyChallengeResponseDto } from '#/modules/auth/dto/2fa-verify-challenge.response.dto';

@Injectable()
@CommandHandler(Verify2FAChallengeCommand)
export class Verify2FAChallengeHandler implements ICommandHandler<Verify2FAChallengeCommand, TwoFactorVerifyChallengeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly verificationStore: VerificationStore,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: Verify2FAChallengeCommand): Promise<TwoFactorVerifyChallengeResponseDto> {
    const verification = await this.identifyVerification(command.input.challengeId);
    await this.verifyNotExpired(command.input.challengeId, verification);

    const userId = this.extractUserId(verification);
    const user = await this.identifyUser(userId);
    this.verifyEnabled(user);

    const twoFactor = await this.identifyTwoFactor(user.id);
    this.verifyNotLocked(twoFactor);
    await this.verifyCode(twoFactor, command.input.code);
    await this.consumeVerification(command.input.challengeId, verification);

    return this.process(user, twoFactor);
  }

  private async identifyVerification(challengeId: string): Promise<VerificationRecord> {
    const verification = await this.verificationStore.get(`2fa:${challengeId}`);
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }
    return verification;
  }

  private async verifyNotExpired(
    challengeId: string,
    verification: VerificationRecord,
  ): Promise<void> {
    if (verification.expiresAt <= Date.now()) {
      await this.verificationStore.consume(`2fa:${challengeId}`);
      throw new ApplicationError({ code: 'TOKEN_EXPIRED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async consumeVerification(
    challengeId: string,
    verification: VerificationRecord,
  ): Promise<void> {
    const consumed = await this.verificationStore.consume(`2fa:${challengeId}`);
    if (
      !consumed
      || consumed.value !== verification.value
      || consumed.expiresAt !== verification.expiresAt
    ) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }
  }

  private extractUserId(verification: VerificationRecord): string {
    if (!verification.value) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }
    return verification.value;
  }

  private async identifyUser(userId: string): Promise<User> {
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private verifyEnabled(user: User): void {
    if (!user.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ENABLED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyTwoFactor(userId: string): Promise<TwoFactor> {
    const twoFactor = await this.em.findOne(TwoFactor, { user: userId });
    if (!twoFactor) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ENABLED', status: HttpStatus.BAD_REQUEST });
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

  private async process(
    user: User,
    twoFactor: TwoFactor,
  ): Promise<TwoFactorVerifyChallengeResponseDto> {
    twoFactor.verified = true;
    twoFactor.failedVerificationCount = 0;
    twoFactor.lockedUntil = null;

    await this.sessionContext.establish({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      phoneNumber: user.phoneNumber ?? null,
      phoneNumberVerified: Boolean(user.phoneNumberVerified),
      role: user.role ?? null,
      permissions: {},
      requiredTermsAgreed: false,
      passwordUpdatedAt: null,
      isPasswordChangeRequired: false,
      twoFactorEnabled: true,
    });

    return { ok: true };
  }
}
