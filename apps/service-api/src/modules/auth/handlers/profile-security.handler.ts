import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt, encrypt, verify } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { PrincipalContext } from '#/common/contexts/principal.context';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ChangePasswordCommand, DisableTwoFactorCommand, EnableTwoFactorCommand, GenerateTwoFactorCommand, UnregisterCommand } from '#/modules/auth/commands';
import { ChangePasswordResponseDto, GenerateTwoFactorResponseDto, TwoFactorStateResponseDto, UnregisterResponseDto } from '#/modules/auth/dto/profile-security.dto';
import { updateCredentialPassword } from '#/modules/auth/password-policy';
import { generateTotpSecret, verifyTotp } from '#/modules/auth/totp';

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, ChangePasswordResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponseDto> {
    if (!SECURITY_CONFIG.credentialAvailable) throw new ApplicationError({ code: 'CREDENTIAL_AUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    const user = await identifyUser(this.em, this.principal);
    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    if (command.input.newPassword !== command.input.confirmPassword) {
      throw new ApplicationError({ code: 'PASSWORD_CONFIRMATION_MISMATCH', status: HttpStatus.BAD_REQUEST });
    }
    if (!await verify(command.input.currentPassword, account.password)) {
      throw new ApplicationError({ code: 'INVALID_CURRENT_PASSWORD', status: HttpStatus.BAD_REQUEST });
    }
    await updateCredentialPassword(account, command.input.newPassword);
    return ChangePasswordResponseDto.fromPlain({ ok: true });
  }
}

@Injectable()
@CommandHandler(GenerateTwoFactorCommand)
export class GenerateTwoFactorHandler implements ICommandHandler<GenerateTwoFactorCommand, GenerateTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<GenerateTwoFactorResponseDto> {
    assertTwoFactorEnabled();
    const user = await identifyUser(this.em, this.principal);
    if (user.twoFactorEnabled) throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    const secret = generateTotpSecret();
    const existing = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (existing) {
      assertVerificationUnlocked(existing);
      existing.secret = encrypt(secret, env.TWO_FACTOR_ENCRYPTION_KEY);
      existing.verified = false;
      existing.failedVerificationCount = 0;
      existing.lockedUntil = null;
    }
    else {
      this.em.persist(this.em.create(TwoFactor, { user: this.em.getReference(User, user.id), secret: encrypt(secret, env.TWO_FACTOR_ENCRYPTION_KEY), verified: false }));
    }
    return GenerateTwoFactorResponseDto.fromPlain({ secret, digits: SECURITY_CONFIG.twoFactor.digits, periodSeconds: SECURITY_CONFIG.twoFactor.periodSeconds });
  }
}

@Injectable()
@CommandHandler(EnableTwoFactorCommand)
export class EnableTwoFactorHandler implements ICommandHandler<EnableTwoFactorCommand, TwoFactorStateResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: EnableTwoFactorCommand): Promise<TwoFactorStateResponseDto> {
    assertTwoFactorEnabled();
    const user = await identifyUser(this.em, this.principal);
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (!twoFactor) throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.BAD_REQUEST });
    assertVerificationUnlocked(twoFactor);
    if (!verifyTotp(decrypt(twoFactor.secret, env.TWO_FACTOR_ENCRYPTION_KEY), command.input.code)) {
      const now = new Date();
      const attempts = twoFactor.lockedUntil && twoFactor.lockedUntil.getTime() <= now.getTime()
        ? 1
        : (twoFactor.failedVerificationCount ?? 0) + 1;
      twoFactor.failedVerificationCount = attempts;
      twoFactor.lockedUntil = attempts >= SECURITY_CONFIG.lockout.maxFailureAttempts
        ? new Date(now.getTime() + TimeUtil.ms.minute(SECURITY_CONFIG.lockout.lockoutDurationMinutes))
        : null;
      await this.em.flush();
      throw new ApplicationError({ code: 'INVALID_TWO_FACTOR_CODE', status: HttpStatus.BAD_REQUEST });
    }
    twoFactor.verified = true;
    twoFactor.failedVerificationCount = 0;
    twoFactor.lockedUntil = null;
    user.twoFactorEnabled = true;
    return TwoFactorStateResponseDto.fromPlain({ enabled: true });
  }
}

@Injectable()
@CommandHandler(DisableTwoFactorCommand)
export class DisableTwoFactorHandler implements ICommandHandler<DisableTwoFactorCommand, TwoFactorStateResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<TwoFactorStateResponseDto> {
    if (SECURITY_CONFIG.twoFactor.required) throw new ApplicationError({ code: 'TWO_FACTOR_REQUIRED', status: HttpStatus.FORBIDDEN });
    const user = await identifyUser(this.em, this.principal);
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    user.twoFactorEnabled = false;
    return TwoFactorStateResponseDto.fromPlain({ enabled: false });
  }
}

@Injectable()
@CommandHandler(UnregisterCommand)
export class UnregisterHandler implements ICommandHandler<UnregisterCommand, UnregisterResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<UnregisterResponseDto> {
    const user = await identifyUser(this.em, this.principal);
    user.deletedAt = new Date();
    return UnregisterResponseDto.fromPlain({ ok: true });
  }
}

async function identifyUser(em: AppEntityManager, principal: PrincipalContext): Promise<User> {
  const user = await em.findOne(User, { id: principal.ensureUser().id }, { filters: false });
  if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return user;
}

function assertTwoFactorEnabled(): void {
  if (!SECURITY_CONFIG.twoFactor.enabled && !SECURITY_CONFIG.twoFactor.required) throw new ApplicationError({ code: 'TWO_FACTOR_DISABLED', status: HttpStatus.FORBIDDEN });
}

function assertVerificationUnlocked(twoFactor: TwoFactor): void {
  if (twoFactor.isLocked) throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_LOCKED', status: HttpStatus.TOO_MANY_REQUESTS });
}
