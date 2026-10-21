import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { updateCredentialPassword } from '@pkg/server-core/auth';
import { ApplicationError } from '@pkg/shared/common';
import { assertPasswordPolicy } from '@pkg/shared/policy';
import { encrypt, hashWithSecret } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '~/app.config';
import { Account, Profile, User } from '~/core/database/entities/auth';
import { Role } from '~/core/database/entities/auth.extensions';
import { AppEntityManager } from '~/core/database/entity-manager';
import { env } from '~/env';
import { RequestEmailVerificationCommand } from '~/modules/auth/email-verification/request-email-verification.command';
import { RequestEmailVerificationRequestDto } from '~/modules/auth/email-verification/request-email-verification.request.dto';
import { CreateOperatorCommand } from '~/modules/operator/account/create-operator.command';
import { CreateOperatorResponseDto } from '~/modules/operator/account/create-operator.response.dto';

@Injectable()
@CommandHandler(CreateOperatorCommand)
export class CreateOperatorHandler implements ICommandHandler<CreateOperatorCommand, CreateOperatorResponseDto> {
  private readonly logger = new Logger(CreateOperatorHandler.name);

  constructor(
    private readonly em: AppEntityManager,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: CreateOperatorCommand): Promise<CreateOperatorResponseDto> {
    assertPasswordPolicy(command.input.password, SECURITY_CONFIG.password);
    const email = {
      encrypted: encrypt(command.input.email, env.PII_ENCRYPTION_KEY),
      hash: hashWithSecret(command.input.email, env.PII_HASH_KEY),
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
    await updateCredentialPassword(account, command.input.password, SECURITY_CONFIG.password);
    this.em.persist([operator, profile, account]);
    await this.em.flush();
    const emailVerificationRequired = SECURITY_CONFIG.registration.requireEmailVerification;
    let emailVerificationQueued = false;
    if (emailVerificationRequired) {
      try {
        const result = await this.commandBus.execute(new RequestEmailVerificationCommand(
          RequestEmailVerificationRequestDto.parse({ email: command.input.email }),
        ));
        emailVerificationQueued = result.accepted;
      }
      catch (error) {
        this.logger.warn(`운영자 이메일 인증 메일 발송 요청을 등록하지 못했습니다: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return CreateOperatorResponseDto.parseEntity(operator, emailVerificationRequired, emailVerificationQueued);
  }
}
