import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verifySync } from 'otplib';

import { SessionContext } from '#/common/contexts/session.context';
import { type VerificationRecord, VerificationStore } from '#/common/stores/verification.store';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { Verify2FAChallengeCommand } from '#/modules/auth/commands/2fa-verify-challenge.command';
import type { TwoFactorVerifyChallengeResponseDto } from '#/modules/auth/dto/2fa-verify-challenge.response.dto';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
@CommandHandler(Verify2FAChallengeCommand)
export class Verify2FAChallengeHandler implements ICommandHandler<Verify2FAChallengeCommand, TwoFactorVerifyChallengeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly verificationStore: VerificationStore,
    private readonly sessionContext: SessionContext,
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async execute(command: Verify2FAChallengeCommand): Promise<TwoFactorVerifyChallengeResponseDto> {
    const verification = await this.identifyVerification(command.input.challengeId);
    await this.verifyNotExpired(command.input.challengeId, verification);

    const { userId, rememberMe } = this.extractPayload(verification);
    const user = await this.identifyUser(userId);
    this.verifyEnabled(user);

    const twoFactor = await this.identifyTwoFactor(user.id);
    this.verifyNotLocked(twoFactor);
    await this.verifyCode(twoFactor, command.input.code);
    await this.consumeVerification(command.input.challengeId, verification);

    return this.process(user, twoFactor, rememberMe);
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

  private extractPayload(verification: VerificationRecord): { userId: string, rememberMe: boolean } {
    if (!verification.value) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }
    try {
      const parsed = JSON.parse(verification.value) as unknown;
      if (typeof parsed === 'object' && parsed && 'userId' in parsed) {
        const payload = parsed as { userId: string, rememberMe?: boolean };
        if (typeof payload.userId === 'string') {
          return { userId: payload.userId, rememberMe: Boolean(payload.rememberMe) };
        }
      }
    }
    catch {
      // Fallback for legacy plain userId strings
    }
    return { userId: verification.value, rememberMe: false };
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
      const authPolicy = await this.systemConfigService.getAuthPolicy();
      const now = new Date();
      const failedVerificationCount = (twoFactor.failedVerificationCount ?? 0) + 1;
      twoFactor.failedVerificationCount = failedVerificationCount;
      if (failedVerificationCount >= authPolicy.loginFailureThreshold) {
        const lockDurationMs = authPolicy.loginLockDurationMinutes * 60 * 1000;
        twoFactor.lockedUntil = new Date(now.getTime() + lockDurationMs);
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
    rememberMe?: boolean,
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
    }, { rememberMe });

    return { ok: true };
  }
}
