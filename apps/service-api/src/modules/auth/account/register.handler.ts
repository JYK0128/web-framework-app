import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EVENT_BROKER } from '@pkg/server-core/event-broker/event-broker.interface';
import { EventBroker } from '@pkg/server-core/event-broker/event-broker.service';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { ApplicationError } from '@pkg/shared/common';
import { assertPasswordPolicy } from '@pkg/shared/policy';
import { encrypt, hashPassword, hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Account, Profile, User } from '#/core/database/entities/auth';
import { Role, RoleCode } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { RegisterCommand } from '#/modules/auth/account/register.command';
import { RegisterResponseDto } from '#/modules/auth/account/register.response.dto';
import { sendEmailVerificationChallenge } from '#/modules/auth/email-verification/email-verification.helper';
import { ensureEmailNotificationConfigured } from '#/modules/system-config/notification/service-email-config.helper';
import { SystemContext } from '#/modules/system-config/system.context';

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, RegisterResponseDto> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly kv: KvStore,
    private readonly systemContext: SystemContext,
    @Inject(EVENT_BROKER.REDIS_STREAMS) private readonly eventBroker: EventBroker,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResponseDto> {
    if (!SECURITY_CONFIG.registration.allowRegistration) throw new ApplicationError({ code: 'REGISTRATION_DISABLED', status: HttpStatus.FORBIDDEN });
    if (!SECURITY_CONFIG.credentialAvailable) throw new ApplicationError({ code: 'CREDENTIAL_AUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    assertPasswordPolicy(command.input.password, SECURITY_CONFIG.password);
    if (SECURITY_CONFIG.registration.requireEmailVerification) await ensureEmailNotificationConfigured(this.systemContext);

    const email = command.input.email.trim().toLowerCase();
    const emailHash = hashWithSecret(email, env.PII_HASH_KEY);
    if (await this.em.findOne(User, { profile: { emailHash } }, { filters: false })) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: RoleCode.MEMBER }, { filters: false });
    if (!role) throw new ApplicationError({ code: 'REGISTRATION_UNAVAILABLE', status: HttpStatus.SERVICE_UNAVAILABLE });

    const passwordHash = await hashPassword(command.input.password);
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
        await sendEmailVerificationChallenge(this.eventBroker, this.kv, user, profile, email);
        verificationEmailSent = true;
      }
      catch (error) {
        this.logger.warn(`Registration email verification could not be sent: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return RegisterResponseDto.parse({ emailVerificationRequired: SECURITY_CONFIG.registration.requireEmailVerification, verificationEmailSent });
  }
}
