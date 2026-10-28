import { LockMode } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE, verifyTotp } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { KvStore } from '@pkg/server-core/kv-store';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '~/app.config';
import { User } from '~/core/database/entities/auth';
import { TwoFactor } from '~/core/database/entities/auth.extensions';
import { env } from '~/env';
import { AuthKvStoreKey } from '~/modules/auth/auth.key';
import { TwoFactorLoginCommand } from '~/modules/auth/two-factor/two-factor-login.command';
import { TwoFactorLoginResponseDto } from '~/modules/auth/two-factor/two-factor-login.response.dto';

interface TwoFactorLoginChallenge {
  userId: string
  rememberMe: boolean
  attempts: number
}

@Injectable()
@CommandHandler(TwoFactorLoginCommand)
export class TwoFactorLoginHandler implements ICommandHandler<TwoFactorLoginCommand, TwoFactorLoginResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    @Inject(USER_AUTH_SERVICE)
    private readonly authTokenService: IUserAuthService,
  ) {}

  async execute(command: TwoFactorLoginCommand): Promise<TwoFactorLoginResponseDto> {
    const { twoFactorChallengeToken, code } = command.input;
    const key = AuthKvStoreKey.twoFactorLoginChallenge(twoFactorChallengeToken);
    const rawRecord = await this.kvStore.get<string>(key);
    const challenge = parseChallenge(rawRecord);
    if (!SECURITY_CONFIG.credentialAvailable || !rawRecord || !challenge) {
      if (rawRecord) await this.kvStore.delIfValue(key, rawRecord);
      throw invalidChallenge();
    }

    const result = await this.em.transactional(async (em) => {
      const user = await em.findOne(User, { id: challenge.userId }, { populate: ['role'], refresh: true, lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.twoFactorEnabled
        || !(SECURITY_CONFIG.twoFactor.required || SECURITY_CONFIG.twoFactor.enabled)) {
        await this.kvStore.delIfValue(key, rawRecord);
        throw invalidChallenge();
      }
      if (SECURITY_CONFIG.registration.requireEmailVerification && !user.emailVerified) {
        await this.kvStore.delIfValue(key, rawRecord);
        throw new ApplicationError({
          code: 'EMAIL_VERIFICATION_REQUIRED',
          status: HttpStatus.FORBIDDEN,
        });
      }

      const twoFactor = await em.findOne(TwoFactor, { user: user.id, verified: true }, { filters: false, refresh: true, lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!twoFactor) {
        await this.kvStore.delIfValue(key, rawRecord);
        throw invalidChallenge();
      }

      const now = new Date();
      if (twoFactor.isLockedAt(now)) {
        await this.kvStore.delIfValue(key, rawRecord);
        return new ApplicationError({ code: 'TWO_FACTOR_LOCKED', status: HttpStatus.TOO_MANY_REQUESTS });
      }
      if (!verifyTotp(decrypt(twoFactor.secret, env.TWO_FACTOR_ENCRYPTION_KEY), code, SECURITY_CONFIG.twoFactor)) {
        twoFactor.recordVerificationFailure(now, SECURITY_CONFIG.lockout.maxFailureAttempts, TimeUtil.ms.minute(SECURITY_CONFIG.lockout.lockoutDurationMinutes));
        return new ApplicationError({ code: 'TWO_FACTOR_INVALID', status: HttpStatus.UNAUTHORIZED });
      }

      if (!await this.kvStore.delIfValue(key, rawRecord)) throw invalidChallenge();

      user.updateMetadata({
        lastLoginAt: now,
        failedLoginAttempts: 0,
        loginFailureWindowStartedAt: null,
        lockedUntil: null,
      });
      twoFactor.resetVerificationFailures();
      return user;
    });
    if (result instanceof ApplicationError) {
      if (result.code === 'TWO_FACTOR_INVALID') await this.recordFailedAttempt(key, rawRecord, challenge);
      throw result;
    }
    const user = result;

    const tokenPair = await this.authTokenService.login(user, { rememberMe: challenge.rememberMe });
    return TwoFactorLoginResponseDto.parse({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      requiresTwoFactor: false,
    });
  }

  private async recordFailedAttempt(key: string, rawRecord: string, challenge: TwoFactorLoginChallenge): Promise<void> {
    const ttlSeconds = await this.kvStore.getTtlSeconds(key);
    const nextAttempts = challenge.attempts + 1;
    if (!ttlSeconds || ttlSeconds <= 0 || nextAttempts >= SECURITY_CONFIG.lockout.maxFailureAttempts) {
      await this.kvStore.delIfValue(key, rawRecord);
      return;
    }

    if (!await this.kvStore.delIfValue(key, rawRecord)) throw invalidChallenge();
    await this.kvStore.set(key, JSON.stringify({ ...challenge, attempts: nextAttempts }), ttlSeconds);
  }
}

function parseChallenge(value: string | null): TwoFactorLoginChallenge | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Partial<TwoFactorLoginChallenge>;
    if (typeof candidate.userId !== 'string' || typeof candidate.rememberMe !== 'boolean'
      || typeof candidate.attempts !== 'number' || !Number.isInteger(candidate.attempts) || candidate.attempts < 0) return null;
    return { userId: candidate.userId, rememberMe: candidate.rememberMe, attempts: candidate.attempts };
  }
  catch {
    return null;
  }
}

function invalidChallenge(): ApplicationError {
  return new ApplicationError({
    code: 'TWO_FACTOR_CHALLENGE_INVALID',
    status: HttpStatus.UNAUTHORIZED,
  });
}
