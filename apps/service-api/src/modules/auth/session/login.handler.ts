import { randomUUID } from 'node:crypto';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type AuthUser, type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { hashWithSecret, verifyPassword } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Account, User } from '#/core/database/entities/auth';
import { TwoFactor } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { AuthKvStoreKey } from '#/modules/auth/auth.key';
import { LoginCommand } from '#/modules/auth/session/login.command';
import { LoginResponseDto } from '#/modules/auth/session/login.response.dto';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly kvStore: KvStore,
    @Inject(USER_AUTH_SERVICE)
    private readonly authTokenService: IUserAuthService,
  ) {}

  // Login coordinates policy checks and persistence in sequence; keep the flow explicit.

  async execute(command: LoginCommand): Promise<LoginResponseDto> {
    const { input } = command;
    if (!SECURITY_CONFIG.credentialAvailable) throw new ApplicationError({ code: 'CREDENTIAL_AUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });

    const user = await this.em.findOne(User, { profile: { emailHash: hashWithSecret(input.email, env.PII_HASH_KEY) } }, { populate: ['role'] });
    if (!user) {
      throw new ApplicationError({
        code: 'INVALID_CREDENTIALS',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    if (user.isDeleted) {
      throw new ApplicationError({
        code: 'ACCOUNT_DELETED',
        status: HttpStatus.FORBIDDEN,
      });
    }

    if (user.isBanned) {
      throw new ApplicationError({
        code: 'ACCOUNT_BANNED',
        status: HttpStatus.FORBIDDEN,
      });
    }

    if (user.isLocked) {
      throw new ApplicationError({
        code: 'ACCOUNT_LOCKED',
        status: HttpStatus.FORBIDDEN,
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
      });
    }

    const isPasswordValid = Buffer.byteLength(input.password, 'utf8') <= SECURITY_CONFIG.password.passwordMaxBytes
      && await verifyPassword(input.password, account.password);
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
      });
    }

    if (SECURITY_CONFIG.registration.requireEmailVerification && !user.emailVerified) {
      throw new ApplicationError({
        code: 'EMAIL_VERIFICATION_REQUIRED',
        status: HttpStatus.FORBIDDEN,
      });
    }

    if (user.twoFactorEnabled && (SECURITY_CONFIG.twoFactor.required || SECURITY_CONFIG.twoFactor.enabled)) {
      return this.createTwoFactorChallenge(user, input.rememberMe === true);
    }

    user.updateMetadata({
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      loginFailureWindowStartedAt: null,
      lockedUntil: null,
    });
    await this.em.flush();

    const tokenPair = await this.authTokenService.login(this.toAuthUser(user), {
      rememberMe: input.rememberMe,
    });
    return LoginResponseDto.parse({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      requiresTwoFactor: false,
    });
  }

  private async createTwoFactorChallenge(user: User, rememberMe: boolean): Promise<LoginResponseDto> {
    const twoFactor = await this.em.findOneOrFail(TwoFactor, { user: user.id, verified: true }, {
      filters: false,
      failHandler: () => new ApplicationError({
        code: 'TWO_FACTOR_SETUP_UNAVAILABLE',
        status: HttpStatus.UNAUTHORIZED,
      }),
    });

    if (twoFactor.isLocked) throw new ApplicationError({ code: 'TWO_FACTOR_LOCKED', status: HttpStatus.TOO_MANY_REQUESTS });

    const twoFactorChallengeToken = randomUUID();
    await this.kvStore.set(
      AuthKvStoreKey.twoFactorLoginChallenge(twoFactorChallengeToken),
      JSON.stringify({ userId: user.id, rememberMe, attempts: 0 }),
      SECURITY_CONFIG.twoFactor.challengeTtlSeconds,
    );
    return LoginResponseDto.parse({ requiresTwoFactor: true, twoFactorChallengeToken });
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      phoneNumberVerified: user.phoneNumberVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      isDeleted: user.isDeleted,
      isBanned: user.isBanned,
      isLocked: user.isLocked,
      role: user.role
        ? {
          id: user.role.id,
          code: user.role.code,
          permissions: user.role.permissions ?? [],
        }
        : null,
    };
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
