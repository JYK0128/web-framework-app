import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt, hmac, verify } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { type IUserAuthService, type TokenPairResult, USER_AUTH_SERVICE } from '#/infra/auth/user/user-auth.interface';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { LoginCommand } from '#/modules/auth/commands/login.command';
import { isCredentialPasswordExpired } from '#/modules/auth/password-policy';
import { verifyTotp } from '#/modules/auth/totp';

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly em: AppEntityManager,
    @Inject(USER_AUTH_SERVICE)
    private readonly authTokenService: IUserAuthService,
  ) {}

  // Login coordinates policy checks and persistence in sequence; keep the flow explicit.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async execute(command: LoginCommand): Promise<TokenPairResult> {
    const { input } = command;

    const user = await this.em.findOne(User, { emailHash: hmac(input.email, env.PII_HASH_KEY) }, { populate: ['role'] });
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

    if (isCredentialPasswordExpired(account)) {
      throw new ApplicationError({ code: 'PASSWORD_EXPIRED', status: HttpStatus.FORBIDDEN, message: '비밀번호가 만료됐습니다. 비밀번호 재설정 후 다시 로그인해 주세요.' });
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
      if (!twoFactor || !command.input.twoFactorCode || !verifyTotp(decrypt(twoFactor.secret, env.APP_ENCRYPTION_KEY), command.input.twoFactorCode)) {
        const now = new Date();
        const attempts = getCurrentFailureAttempts(user, now.getTime()) + 1;
        user.updateMetadata({
          failedLoginAttempts: attempts,
          loginFailureWindowStartedAt: getFailureWindowStartedAt(user, now.getTime()),
          lockedUntil: null,
          ...(attempts >= SECURITY_CONFIG.lockout.maxFailureAttempts
            ? { lockedUntil: new Date(now.getTime() + TimeUtil.ms.minute(SECURITY_CONFIG.lockout.lockoutDurationMinutes)) }
            : {}),
        });
        await this.em.flush();
        throw new ApplicationError({ code: 'TWO_FACTOR_INVALID', status: HttpStatus.UNAUTHORIZED, message: '2단계 인증 코드가 없거나 올바르지 않습니다.' });
      }
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
    return tokenPair;
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
