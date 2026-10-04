import { randomUUID } from 'node:crypto';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { hmac, verify } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { type IUserAuthService, USER_AUTH_SERVICE } from '#/infra/auth/user/user-auth.interface';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { KvStoreKey } from '#/infra/kv-store/kv-store.helper';
import { KvStore } from '#/infra/kv-store/kv-store.service';
import { LoginCommand, type LoginResult } from '#/modules/auth/commands';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    @Inject(USER_AUTH_SERVICE)
    private readonly authTokenService: IUserAuthService,
  ) {}

  // Login coordinates policy checks and persistence in sequence; keep the flow explicit.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async execute(command: LoginCommand): Promise<LoginResult> {
    const { input } = command;

    const user = await this.em.findOne(User, { profile: { emailHash: hmac(input.email, env.PII_HASH_KEY) } }, { populate: ['role', 'profile'] });
    if (!user) {
      throw new ApplicationError({
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    if (user.isDeleted) {
      throw new ApplicationError({
        code: 'ACCOUNT_DELETED',
        status: HttpStatus.FORBIDDEN,
        message: '삭제된 계정입니다. 고객센터에 문의하세요.',
      });
    }

    if (user.isBanned) {
      throw new ApplicationError({
        code: 'ACCOUNT_BANNED',
        status: HttpStatus.FORBIDDEN,
        message: user.banReason ? `이용이 제한된 계정입니다: ${user.banReason}` : '이용이 제한된 계정입니다.',
      });
    }

    if (user.isLocked) {
      throw new ApplicationError({
        code: 'ACCOUNT_LOCKED',
        status: HttpStatus.FORBIDDEN,
        message: '로그인 실패 횟수 초과로 계정이 잠겼습니다. 잠시 후 다시 시도하세요.',
      });
    }

    const account = await this.em.findOne(Account, {
      user: user.id,
      providerId: 'credential',
    });

    if (!account || !account.password) {
      throw new ApplicationError({
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    const isPasswordValid = Buffer.byteLength(input.password, 'utf8') <= SECURITY_CONFIG.password.maxBytes
      && await verify(input.password, account.password);
    if (!isPasswordValid) {
      const now = new Date();
      const attempts = getCurrentFailureAttempts(user, now.getTime()) + 1;
      const patch: Record<string, unknown> = { failedLoginAttempts: attempts, loginFailureWindowStartedAt: getFailureWindowStartedAt(user, now.getTime()), lockedUntil: null };

      if (attempts >= SECURITY_CONFIG.lockout.maxFailureAttempts) {
        patch.lockedUntil = new Date(now.getTime() + TimeUtil.ms.minute(SECURITY_CONFIG.lockout.lockoutDurationMinutes));
      }

      user.updateMetadata(patch);
      await this.em.flush();

      throw new ApplicationError({
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
      });
    }

    if (SECURITY_CONFIG.registration.requireEmailVerification && !user.emailVerified) {
      throw new ApplicationError({
        code: 'EMAIL_VERIFICATION_REQUIRED',
        status: HttpStatus.FORBIDDEN,
        message: '로그인하려면 이메일 인증을 완료해야 합니다.',
      });
    }

    if (user.twoFactorEnabled && (SECURITY_CONFIG.twoFactor.required || SECURITY_CONFIG.twoFactor.enabled)) {
      const twoFactor = await this.em.findOne(TwoFactor, { user: user.id, verified: true }, { filters: false });
      if (!twoFactor) {
        throw new ApplicationError({
          code: 'TWO_FACTOR_INVALID',
          status: HttpStatus.UNAUTHORIZED,
          message: '등록된 2단계 인증 정보를 사용할 수 없습니다. 다시 설정해 주세요.',
        });
      }

      const twoFactorChallengeToken = randomUUID();
      await this.kvStore.set(
        KvStoreKey.auth.twoFactorLoginChallenge(twoFactorChallengeToken),
        JSON.stringify({ userId: user.id, rememberMe: input.rememberMe === true, attempts: 0 }),
        SECURITY_CONFIG.twoFactor.challengeTtlSeconds,
      );
      return { requiresTwoFactor: true, twoFactorChallengeToken };
    }

    user.updateMetadata({
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      loginFailureWindowStartedAt: null,
      lockedUntil: null,
    });
    await this.em.flush();

    const tokenPair = await this.authTokenService.login(user, {
      rememberMe: input.rememberMe,
    });
    return { ...tokenPair, requiresTwoFactor: false };
  }
}

function getCurrentFailureAttempts(user: User, now = Date.now()): number {
  const lockedUntil = user.metadata?.lockedUntil;
  if (lockedUntil && lockedUntil.getTime() <= now) return 0;
  const windowStartedAt = user.metadata?.loginFailureWindowStartedAt;
  const failureWindowMinutes = SECURITY_CONFIG.lockout.failureWindowMinutes;
  if (failureWindowMinutes > 0 && (!windowStartedAt || windowStartedAt.getTime() + TimeUtil.ms.minute(failureWindowMinutes) <= now)) return 0;
  return user.metadata?.failedLoginAttempts ?? 0;
}

function getFailureWindowStartedAt(user: User, now: number): Date {
  const windowStartedAt = user.metadata?.loginFailureWindowStartedAt;
  const lockedUntil = user.metadata?.lockedUntil;
  const failureWindowMinutes = SECURITY_CONFIG.lockout.failureWindowMinutes;
  if (failureWindowMinutes <= 0 || (lockedUntil && lockedUntil.getTime() <= now) || !windowStartedAt || windowStartedAt.getTime() + TimeUtil.ms.minute(failureWindowMinutes) <= now) {
    return new Date(now);
  }
  return windowStartedAt;
}
