import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { protectEmail } from '#/common/security/pii';
import { Role } from '#/entities/auth.extensions/role.entity';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { BanUserCommand, CreateUserCommand, DeleteUserCommand, ResetUserTwoFactorCommand, RestoreUserCommand, UnbanUserCommand, UpdateUserRoleCommand } from '#/modules/users/commands';
import { CreateUserResponseDto, UserActionResponseDto } from '#/modules/users/interfaces';

const ok = () => UserActionResponseDto.fromPlain({});

@Injectable()
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, CreateUserResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResponseDto> {
    assertSuperAdmin(this.principal);
    const email = protectEmail(command.data.email);
    const existing = await this.em.findOne(User, { emailHash: email.hash }, { filters: false });
    if (existing) {
      throw new ApplicationError({ code: 'USER_EMAIL_ALREADY_EXISTS', status: HttpStatus.CONFLICT, message: '이미 사용 중인 이메일입니다.' });
    }
    const role = await this.em.findOne(Role, { code: command.data.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '역할을 찾을 수 없습니다.' });
    }
    const user = this.em.create(User, {
      name: command.data.name.trim(),
      emailEncrypted: email.encrypted,
      emailHash: email.hash,
      emailVerified: true,
      role,
    });
    const account = this.em.create(Account, {
      user,
      accountId: user.id,
      providerId: Account.PROVIDER_CREDENTIAL,
      password: await hash(command.data.password),
      metadata: { passwordUpdatedAt: new Date() },
    });
    this.em.persist([user, account]);
    return CreateUserResponseDto.fromPlain({ id: user.id });
  }
}

@Injectable()
@CommandHandler(BanUserCommand)
export class BanUserHandler implements ICommandHandler<BanUserCommand, UserActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: BanUserCommand): Promise<UserActionResponseDto> {
    assertSuperAdmin(this.principal);
    const user = await findUser(this.em, command.input.userId);
    assertNotSelf(user, this.principal);
    assertNotSuperAdmin(user);
    if (command.input.data.expiresAt && command.input.data.expiresAt <= new Date()) {
      throw new ApplicationError({ code: 'BAN_EXPIRY_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST, message: '정지 만료일은 현재보다 미래여야 합니다.' });
    }
    user.banned = true;
    user.banReason = command.input.data.reason?.trim() || null;
    user.banExpires = command.input.data.expiresAt ?? null;
    return ok();
  }
}

@Injectable()
@CommandHandler(UnbanUserCommand)
export class UnbanUserHandler implements ICommandHandler<UnbanUserCommand, UserActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: UnbanUserCommand): Promise<UserActionResponseDto> {
    assertSuperAdmin(this.principal);
    const user = await findUser(this.em, command.userId);
    user.banned = false;
    user.banReason = null;
    user.banExpires = null;
    return ok();
  }
}

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, UserActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: DeleteUserCommand): Promise<UserActionResponseDto> {
    assertSuperAdmin(this.principal);
    const user = await findUser(this.em, command.userId);
    assertNotSelf(user, this.principal);
    assertNotSuperAdmin(user);
    user.deletedAt = new Date();
    return ok();
  }
}

@Injectable()
@CommandHandler(RestoreUserCommand)
export class RestoreUserHandler implements ICommandHandler<RestoreUserCommand, UserActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: RestoreUserCommand): Promise<UserActionResponseDto> {
    assertSuperAdmin(this.principal);
    const user = await findUser(this.em, command.userId);
    if (!user.deletedAt) {
      throw new ApplicationError({ code: 'USER_NOT_DELETED', status: HttpStatus.CONFLICT, message: '삭제된 계정이 아닙니다.' });
    }
    user.deletedAt = null;
    user.deletedBy = null;
    return ok();
  }
}

@Injectable()
@CommandHandler(UpdateUserRoleCommand)
export class UpdateUserRoleHandler implements ICommandHandler<UpdateUserRoleCommand, UserActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: UpdateUserRoleCommand): Promise<UserActionResponseDto> {
    assertSuperAdmin(this.principal);
    const user = await findUser(this.em, command.input.userId);
    assertNotSelf(user, this.principal);
    if (user.deletedAt) {
      throw new ApplicationError({ code: 'DELETED_USER_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT, message: '삭제된 계정의 역할은 변경할 수 없습니다.' });
    }
    const role = await this.em.findOne(Role, { code: command.input.data.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '역할을 찾을 수 없습니다.' });
    }
    if (user.role?.code === 'super_admin' && role.code !== 'super_admin') {
      const count = await this.em.count(User, { role: user.role.id, deletedAt: null }, { filters: false });
      if (count <= 1) {
        throw new ApplicationError({ code: 'LAST_SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT, message: '마지막 super-admin의 역할은 변경할 수 없습니다.' });
      }
    }
    user.role = role;
    return ok();
  }
}

@Injectable()
@CommandHandler(ResetUserTwoFactorCommand)
export class ResetUserTwoFactorHandler implements ICommandHandler<ResetUserTwoFactorCommand, UserActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: ResetUserTwoFactorCommand): Promise<UserActionResponseDto> {
    assertSuperAdmin(this.principal);
    const user = await findUser(this.em, command.userId);
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    user.twoFactorEnabled = false;
    return ok();
  }
}

async function findUser(em: AppEntityManager, userId: string): Promise<User> {
  const user = await em.findOne(User, { id: userId }, { populate: ['role'], filters: false });
  if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '관리자 정보를 찾을 수 없습니다.' });
  return user;
}

function assertNotSelf(user: User, principal: PrincipalContext): void {
  if (user.id === principal.ensureUser().id) {
    throw new ApplicationError({ code: 'SELF_ACCOUNT_OPERATION_NOT_ALLOWED', status: HttpStatus.CONFLICT, message: '현재 로그인한 계정에는 이 작업을 수행할 수 없습니다.' });
  }
}

function assertSuperAdmin(principal: PrincipalContext): void {
  if (!principal.ensureUser().roles.includes('super_admin')) {
    throw new ApplicationError({ code: 'SUPER_ADMIN_REQUIRED', status: HttpStatus.FORBIDDEN, message: 'super-admin만 관리자 계정을 변경할 수 있습니다.' });
  }
}

function assertNotSuperAdmin(user: User): void {
  if (user.role?.code === 'super_admin') {
    throw new ApplicationError({ code: 'SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT, message: 'super-admin 계정은 보호된 계정입니다.' });
  }
}
