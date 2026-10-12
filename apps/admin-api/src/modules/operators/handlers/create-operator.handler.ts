import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hmac } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { assertPasswordPolicy, updateCredentialPassword } from '#/core/auth/user/policy/password.policy';
import { Account, Profile, User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { env } from '#/env';
import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { CreateOperatorCommand } from '#/modules/operators/commands';
import { CreateOperatorResponseDto } from '#/modules/operators/dto';
import { assertSuperAdmin } from '#/modules/operators/handlers/operator-actions.helpers';

@Injectable()
@CommandHandler(CreateOperatorCommand)
export class CreateOperatorHandler implements ICommandHandler<CreateOperatorCommand, CreateOperatorResponseDto> {
  private readonly logger = new Logger(CreateOperatorHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly principal: PrincipalContext,
    private readonly accountRecovery: AccountRecoveryService,
  ) {}

  async execute(command: CreateOperatorCommand): Promise<CreateOperatorResponseDto> {
    assertSuperAdmin(this.principal);
    assertPasswordPolicy(command.input.password);
    const email = {
      encrypted: encrypt(command.input.email, env.PII_ENCRYPTION_KEY),
      hash: hmac(command.input.email, env.PII_HASH_KEY),
    };
    const existing = await this.em.findOne(User, { profile: { emailHash: email.hash } }, { filters: false });
    if (existing) {
      throw new ApplicationError({ code: 'OPERATOR_EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: command.input.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    const operator = this.em.create(User, {
      emailVerified: !SECURITY_CONFIG.registration.requireEmailVerification,
      role,
    });
    const profile = this.em.create(Profile, {
      user: operator,
      name: command.input.name.trim(),
      emailEncrypted: email.encrypted,
      emailHash: email.hash,
    });
    const account = this.em.create(Account, {
      user: operator,
      accountId: operator.id,
      providerId: Account.PROVIDER_CREDENTIAL,
    });
    await updateCredentialPassword(account, command.input.password);
    this.em.persist([operator, profile, account]);
    await this.em.flush();
    const emailVerificationRequired = SECURITY_CONFIG.registration.requireEmailVerification;
    let emailVerificationSent = false;
    if (emailVerificationRequired) {
      try {
        await this.accountRecovery.requestEmailVerification(command.input.email);
        emailVerificationSent = true;
      }
      catch (error) {
        this.logger.warn(`운영자 이메일 인증 메일을 발송하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return CreateOperatorResponseDto.fromPlain({ id: operator.id, emailVerificationRequired, emailVerificationSent });
  }
}
