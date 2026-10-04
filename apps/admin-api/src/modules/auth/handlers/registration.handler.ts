import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hash, hmac } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Role, RoleCode } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { RegisterCommand } from '#/modules/auth/commands/registration.command';
import { RegisterResponseDto } from '#/modules/auth/interfaces/registration.dto';
import { assertPasswordPolicy } from '#/modules/auth/password-policy';
import { SystemConfigService } from '#/modules/system-configs/system-config.service';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly accountRecovery: AccountRecoveryService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResponseDto> {
    if (!SECURITY_CONFIG.registration.allowRegistration) throw new ApplicationError({ code: 'REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
    if (!SECURITY_CONFIG.registration.allowCredentialRegistration) throw new ApplicationError({ code: 'CREDENTIAL_REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
    assertPasswordPolicy(command.input.password);
    if (SECURITY_CONFIG.registration.requireEmailVerification) await this.systemConfig.ensureEmailDeliveryConfigured();

    const email = command.input.email.trim().toLowerCase();
    const emailHash = hmac(email, env.PII_HASH_KEY);
    if (await this.em.findOne(User, { profile: { emailHash } }, { filters: false })) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: RoleCode.ADMIN }, { filters: false });
    if (!role || role.deletedAt) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, message: '기본 운영자 역할을 사용할 수 없습니다.' });

    const user = this.em.create(User, { emailVerified: !SECURITY_CONFIG.registration.requireEmailVerification, role });
    const profile = this.em.create(Profile, {
      user,
      name: command.input.name.trim(),
      emailEncrypted: encrypt(email, env.PII_ENCRYPTION_KEY),
      emailHash,
    });
    const account = this.em.create(Account, {
      user,
      accountId: user.id,
      providerId: Account.PROVIDER_CREDENTIAL,
      password: await hash(command.input.password),
      metadata: { passwordUpdatedAt: new Date(), passwordHistory: [] },
    });
    this.em.persist([user, profile, account]);
    try {
      await this.em.flush();
    }
    catch (error) {
      if (error instanceof UniqueConstraintViolationException) throw new ApplicationError({ code: 'EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
      throw error;
    }

    let verificationEmailSent = false;
    if (SECURITY_CONFIG.registration.requireEmailVerification) {
      try {
        await this.accountRecovery.requestEmailVerification(email);
        verificationEmailSent = true;
      }
      catch {
        // The account remains pending; the public resend endpoint allows retry without exposing account existence.
      }
    }
    return RegisterResponseDto.fromPlain({ emailVerificationRequired: SECURITY_CONFIG.registration.requireEmailVerification, verificationEmailSent });
  }
}
