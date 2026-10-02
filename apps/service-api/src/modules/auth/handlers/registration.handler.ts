import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, encrypt, hash, hmac } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Role, RoleCode } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { RegisterCommand } from '#/modules/auth/commands/registration.command';
import { ResendEmailVerificationCommand, VerifyEmailCommand } from '#/modules/auth/commands/verify-email.command';
import type { EmailVerificationResponseDto, RegisterResponseDto, ResendEmailVerificationResponseDto } from '#/modules/auth/dto/registration.dto';
import { EmailVerificationService } from '#/modules/auth/email-verification.service';
import { assertPasswordPolicy } from '#/modules/auth/password-policy';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly emailVerification: EmailVerificationService) {}

  async execute(command: RegisterCommand): Promise<RegisterResponseDto> {
    if (!SECURITY_CONFIG.registration.allowRegistration) throw new ApplicationError({ code: 'REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
    if (!SECURITY_CONFIG.registration.allowCredentialRegistration) throw new ApplicationError({ code: 'CREDENTIAL_REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
    assertPasswordPolicy(command.input.password);
    if (SECURITY_CONFIG.registration.requireEmailVerification) await this.emailVerification.ensureConfigured();

    const email = command.input.email.trim().toLowerCase();
    const emailHash = hmac(email, env.PII_HASH_KEY);
    if (await this.em.findOne(User, { profile: { emailHash } }, { filters: false })) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: RoleCode.MEMBER }, { filters: false });
    if (!role) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE, message: '기본 회원 역할이 준비되지 않았습니다.' });

    const passwordHash = await hash(command.input.password);
    const user = this.em.create(User, {
      emailVerified: !SECURITY_CONFIG.registration.requireEmailVerification,
      role,
    });
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
      password: passwordHash,
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
        await this.emailVerification.send(user, profile, email);
        verificationEmailSent = true;
      }
      catch {
        // The account remains pending; the public resend endpoint allows retry without exposing account existence.
      }
    }
    return { emailVerificationRequired: SECURITY_CONFIG.registration.requireEmailVerification, verificationEmailSent };
  }
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, EmailVerificationResponseDto> {
  constructor(private readonly emailVerification: EmailVerificationService) {}
  async execute(command: VerifyEmailCommand): Promise<EmailVerificationResponseDto> {
    await this.emailVerification.verify(command.input.challengeId, command.input.token);
    return { emailVerified: true };
  }
}

@Injectable()
@CommandHandler(ResendEmailVerificationCommand)
export class ResendEmailVerificationHandler implements ICommandHandler<ResendEmailVerificationCommand, ResendEmailVerificationResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly emailVerification: EmailVerificationService) {}
  async execute(command: ResendEmailVerificationCommand): Promise<ResendEmailVerificationResponseDto> {
    if (!SECURITY_CONFIG.registration.requireEmailVerification) return { accepted: true };
    await this.emailVerification.ensureConfigured();
    const user = await this.em.findOne(User, { profile: { emailHash: hmac(command.input.email, env.PII_HASH_KEY) } }, { populate: ['profile'], filters: false });
    if (user && !user.isDeleted && !user.emailVerified) {
      if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      await this.emailVerification.send(user, user.profile, decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
    }
    return { accepted: true };
  }
}
