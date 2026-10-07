import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { type IUserAuthService, type TokenPairResult, USER_AUTH_SERVICE } from '#/infra/auth/user/user-auth.interface';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStoreKey } from '#/infra/kv-store/kv-store.helper';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { TwoFactorLoginCommand } from '#/modules/auth/commands';
import { verifyTotp } from '#/modules/auth/totp';

interface TwoFactorLoginChallenge {
  userId: string
  rememberMe: boolean
  attempts: number
}

@Injectable()
@CommandHandler(TwoFactorLoginCommand)
export class TwoFactorLoginHandler implements ICommandHandler<TwoFactorLoginCommand, TokenPairResult> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    @Inject(USER_AUTH_SERVICE)
    private readonly authTokenService: IUserAuthService,
  ) {}

  async execute(command: TwoFactorLoginCommand): Promise<TokenPairResult> {
    const { twoFactorChallengeToken, code } = command.input;
    const key = KvStoreKey.auth.twoFactorLoginChallenge(twoFactorChallengeToken);
    const rawRecord = await this.kvStore.get<string>(key);
    const challenge = parseChallenge(rawRecord);
    if (!rawRecord || !challenge) {
      if (rawRecord) await this.kvStore.delIfValue(key, rawRecord);
      throw invalidChallenge();
    }

    const user = await this.em.findOne(User, { id: challenge.userId }, { populate: ['role'] });
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

    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id, verified: true }, { filters: false });
    if (!twoFactor) {
      await this.kvStore.delIfValue(key, rawRecord);
      throw invalidChallenge();
    }

    if (!verifyTotp(decrypt(twoFactor.secret, env.TWO_FACTOR_ENCRYPTION_KEY), code)) {
      await this.recordFailedAttempt(key, rawRecord, challenge);
      throw new ApplicationError({
        code: 'ADMIN_TWO_FACTOR_INVALID',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    if (!await this.kvStore.delIfValue(key, rawRecord)) throw invalidChallenge();

    user.updateMetadata({
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      loginFailureWindowStartedAt: null,
      lockedUntil: null,
    });
    await this.em.flush();

    return this.authTokenService.login(user, { rememberMe: challenge.rememberMe });
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
    code: 'ADMIN_TWO_FACTOR_CHALLENGE_INVALID',
    status: HttpStatus.UNAUTHORIZED,
  });
}
