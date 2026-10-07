import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hmac } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { PrincipalContext } from '#/common/contexts/principal.context';
import { Role } from '#/entities/auth.extensions/role.entity';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { AccountRecoveryService } from '#/modules/auth/account-recovery.service';
import { assertPasswordPolicy, updateCredentialPassword } from '#/modules/auth/password-policy';
import { BanOperatorCommand, CreateOperatorCommand, DeleteOperatorCommand, ResetOperatorTwoFactorCommand, RestoreOperatorCommand, UnbanOperatorCommand, UpdateOperatorRoleCommand } from '#/modules/operators/commands';
import { CreateOperatorResponseDto, OperatorActionResponseDto } from '#/modules/operators/interfaces';

const ok = () => OperatorActionResponseDto.fromPlain({ ok: true });

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

@Injectable()
@CommandHandler(BanOperatorCommand)
export class BanOperatorHandler implements ICommandHandler<BanOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: BanOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSelf(operator, this.principal);
    assertNotSuperAdmin(operator);
    if (command.input.data.expiresAt && command.input.data.expiresAt <= new Date()) {
      throw new ApplicationError({ code: 'BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    }
    operator.banned = true;
    operator.banReason = command.input.data.reason?.trim() || null;
    operator.banExpires = command.input.data.expiresAt ?? null;
    return ok();
  }
}

@Injectable()
@CommandHandler(UnbanOperatorCommand)
export class UnbanOperatorHandler implements ICommandHandler<UnbanOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: UnbanOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    operator.banned = false;
    operator.banReason = null;
    operator.banExpires = null;
    return ok();
  }
}

@Injectable()
@CommandHandler(DeleteOperatorCommand)
export class DeleteOperatorHandler implements ICommandHandler<DeleteOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: DeleteOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSelf(operator, this.principal);
    assertNotSuperAdmin(operator);
    operator.deletedAt = new Date();
    return ok();
  }
}

@Injectable()
@CommandHandler(RestoreOperatorCommand)
export class RestoreOperatorHandler implements ICommandHandler<RestoreOperatorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: RestoreOperatorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    if (!operator.deletedAt) {
      throw new ApplicationError({ code: 'OPERATOR_NOT_DELETED', status: HttpStatus.CONFLICT });
    }
    operator.deletedAt = null;
    operator.deletedBy = null;
    return ok();
  }
}

@Injectable()
@CommandHandler(UpdateOperatorRoleCommand)
export class UpdateOperatorRoleHandler implements ICommandHandler<UpdateOperatorRoleCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: UpdateOperatorRoleCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSelf(operator, this.principal);
    if (operator.deletedAt) {
      throw new ApplicationError({ code: 'DELETED_OPERATOR_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: command.input.data.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (operator.role?.code === 'super_admin' && role.code !== 'super_admin') {
      const count = await this.em.count(User, { role: operator.role.id, deletedAt: null }, { filters: false });
      if (count <= 1) {
        throw new ApplicationError({ code: 'LAST_SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT });
      }
    }
    operator.role = role;
    return ok();
  }
}

@Injectable()
@CommandHandler(ResetOperatorTwoFactorCommand)
export class ResetOperatorTwoFactorHandler implements ICommandHandler<ResetOperatorTwoFactorCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: ResetOperatorTwoFactorCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    const twoFactor = await this.em.findOne(TwoFactor, { user: operator.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    operator.twoFactorEnabled = false;
    return ok();
  }
}

async function findOperator(em: AppEntityManager, operatorId: string): Promise<User> {
  const operator = await em.findOne(User, { id: operatorId }, { populate: ['role'], filters: false });
  if (!operator) throw new ApplicationError({ code: 'OPERATOR_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return operator;
}

function assertNotSelf(operator: User, principal: PrincipalContext): void {
  if (operator.id === principal.ensureUser().id) {
    throw new ApplicationError({ code: 'SELF_ACCOUNT_OPERATION_NOT_ALLOWED', status: HttpStatus.CONFLICT });
  }
}

function assertSuperAdmin(principal: PrincipalContext): void {
  if (!principal.ensureUser().roles.includes('super_admin')) {
    throw new ApplicationError({ code: 'SUPER_ADMIN_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
}

function assertNotSuperAdmin(operator: User): void {
  if (operator.role?.code === 'super_admin') {
    throw new ApplicationError({ code: 'SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT });
  }
}
