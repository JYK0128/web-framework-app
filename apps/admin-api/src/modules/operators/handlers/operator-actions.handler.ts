import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hash, hmac } from '@pkg/shared/server';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { Role } from '#/entities/auth.extensions/role.entity';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { BanOperatorCommand, CreateOperatorCommand, DeleteOperatorCommand, ResetOperatorTwoFactorCommand, RestoreOperatorCommand, UnbanOperatorCommand, UpdateOperatorRoleCommand } from '#/modules/operators/commands';
import { CreateOperatorResponseDto, OperatorActionResponseDto } from '#/modules/operators/interfaces';

const ok = () => OperatorActionResponseDto.fromPlain({});

@Injectable()
@CommandHandler(CreateOperatorCommand)
export class CreateOperatorHandler implements ICommandHandler<CreateOperatorCommand, CreateOperatorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: CreateOperatorCommand): Promise<CreateOperatorResponseDto> {
    assertSuperAdmin(this.principal);
    const email = {
      encrypted: encrypt(command.data.email, env.PII_ENCRYPTION_KEY),
      hash: hmac(command.data.email, env.PII_HASH_KEY),
    };
    const existing = await this.em.findOne(User, { emailHash: email.hash }, { filters: false });
    if (existing) {
      throw new ApplicationError({ code: 'OPERATOR_EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT, message: '이미 사용 중인 이메일입니다.' });
    }
    const role = await this.em.findOne(Role, { code: command.data.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '역할을 찾을 수 없습니다.' });
    }
    const operator = this.em.create(User, {
      name: command.data.name.trim(),
      emailEncrypted: email.encrypted,
      emailHash: email.hash,
      emailVerified: true,
      role,
    });
    const account = this.em.create(Account, {
      user: operator,
      accountId: operator.id,
      providerId: Account.PROVIDER_CREDENTIAL,
      password: await hash(command.data.password),
      metadata: { passwordUpdatedAt: new Date() },
    });
    this.em.persist([operator, account]);
    return CreateOperatorResponseDto.fromPlain({ id: operator.id });
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
      throw new ApplicationError({ code: 'BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST, message: '정지 만료일은 현재보다 미래여야 합니다.' });
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
    const operator = await findOperator(this.em, command.operatorId);
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
    const operator = await findOperator(this.em, command.operatorId);
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
    const operator = await findOperator(this.em, command.operatorId);
    if (!operator.deletedAt) {
      throw new ApplicationError({ code: 'OPERATOR_NOT_DELETED', status: HttpStatus.CONFLICT, message: '삭제된 계정이 아닙니다.' });
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
      throw new ApplicationError({ code: 'DELETED_OPERATOR_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT, message: '삭제된 계정의 역할은 변경할 수 없습니다.' });
    }
    const role = await this.em.findOne(Role, { code: command.input.data.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '역할을 찾을 수 없습니다.' });
    }
    if (operator.role?.code === 'super_admin' && role.code !== 'super_admin') {
      const count = await this.em.count(User, { role: operator.role.id, deletedAt: null }, { filters: false });
      if (count <= 1) {
        throw new ApplicationError({ code: 'LAST_SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT, message: '마지막 super-admin의 역할은 변경할 수 없습니다.' });
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
    const operator = await findOperator(this.em, command.operatorId);
    const twoFactor = await this.em.findOne(TwoFactor, { user: operator.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    operator.twoFactorEnabled = false;
    return ok();
  }
}

async function findOperator(em: AppEntityManager, operatorId: string): Promise<User> {
  const operator = await em.findOne(User, { id: operatorId }, { populate: ['role'], filters: false });
  if (!operator) throw new ApplicationError({ code: 'OPERATOR_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '운영자 정보를 찾을 수 없습니다.' });
  return operator;
}

function assertNotSelf(operator: User, principal: PrincipalContext): void {
  if (operator.id === principal.ensureUser().id) {
    throw new ApplicationError({ code: 'SELF_ACCOUNT_OPERATION_NOT_ALLOWED', status: HttpStatus.CONFLICT, message: '현재 로그인한 계정에는 이 작업을 수행할 수 없습니다.' });
  }
}

function assertSuperAdmin(principal: PrincipalContext): void {
  if (!principal.ensureUser().roles.includes('super_admin')) {
    throw new ApplicationError({ code: 'SUPER_ADMIN_REQUIRED', status: HttpStatus.FORBIDDEN, message: 'super-admin만 운영자 계정을 변경할 수 있습니다.' });
  }
}

function assertNotSuperAdmin(operator: User): void {
  if (operator.role?.code === 'super_admin') {
    throw new ApplicationError({ code: 'SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT, message: 'super-admin 계정은 보호된 계정입니다.' });
  }
}
