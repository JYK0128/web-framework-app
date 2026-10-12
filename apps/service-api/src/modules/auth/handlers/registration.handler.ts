import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, encrypt, hash, hmac } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { assertPasswordPolicy } from '#/core/auth/user/policy/password.policy';
import { Account, Profile, User } from '#/core/database/entities/auth';
import { Role, RoleCode } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { KvStore } from '#/core/kv-store/kv-store.service';
import { MessageService } from '#/core/notification';
import { env } from '#/env';
import { RegisterCommand, RequestEmailVerificationCommand, VerifyEmailCommand } from '#/modules/auth/commands';
import { RegisterResponseDto, RequestEmailVerificationResponseDto, VerifyEmailResponseDto } from '#/modules/auth/dto';
import { ensureEmailDeliveryConfigured, sendEmailVerificationChallenge, verifyEmailChallenge } from '#/modules/auth/email-verification.helper';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResponseDto> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore, private readonly messages: MessageService) {}

  async execute(command: RegisterCommand): Promise<RegisterResponseDto> {
    if (!SECURITY_CONFIG.registration.allowRegistration) throw new ApplicationError({ code: 'REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
    if (!SECURITY_CONFIG.credentialAvailable) throw new ApplicationError({ code: 'CREDENTIAL_AUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    assertPasswordPolicy(command.input.password);
    if (SECURITY_CONFIG.registration.requireEmailVerification) await ensureEmailDeliveryConfigured(this.em);

    const email = command.input.email.trim().toLowerCase();
    const emailHash = hmac(email, env.PII_HASH_KEY);
    if (await this.em.findOne(User, { profile: { emailHash } }, { filters: false })) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: RoleCode.MEMBER }, { filters: false });
    if (!role) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });

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
        await sendEmailVerificationChallenge(this.em, this.kv, this.messages, user, profile, email);
        verificationEmailSent = true;
      }
      catch (error) {
        this.logger.warn(`Registration email verification could not be sent: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return RegisterResponseDto.fromPlain({ emailVerificationRequired: SECURITY_CONFIG.registration.requireEmailVerification, verificationEmailSent });
  }
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore) {}
  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    await verifyEmailChallenge(this.em, this.kv, command.input.challengeId, command.input.token);
    return VerifyEmailResponseDto.fromPlain({ ok: true });
  }
}

@Injectable()
@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<RequestEmailVerificationCommand, RequestEmailVerificationResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore, private readonly messages: MessageService) {}
  async execute(command: RequestEmailVerificationCommand): Promise<RequestEmailVerificationResponseDto> {
    if (!SECURITY_CONFIG.registration.requireEmailVerification) return RequestEmailVerificationResponseDto.fromPlain({ accepted: true });
    await ensureEmailDeliveryConfigured(this.em);
    const user = await this.em.findOne(User, { profile: { emailHash: hmac(command.input.email, env.PII_HASH_KEY) } }, { populate: ['profile'], filters: false });
    if (user && !user.isDeleted && !user.emailVerified) {
      if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      await sendEmailVerificationChallenge(this.em, this.kv, this.messages, user, user.profile, decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
    }
    return RequestEmailVerificationResponseDto.fromPlain({ accepted: true });
  }
}
