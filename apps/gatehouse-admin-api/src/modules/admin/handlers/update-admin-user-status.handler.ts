import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { ROLE_NAMES } from '#/entities/auth/role.entity';
import { Session } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';
import { AdminUserDto } from '#/modules/admin/admin.dto';
import { UpdateAdminUserStatusCommand } from '#/modules/admin/commands';

const PROTECTED_ADMIN_ROLES = new Set<string>([ROLE_NAMES.SUPER_ADMIN]);

@Injectable()
@CommandHandler(UpdateAdminUserStatusCommand)
export class UpdateAdminUserStatusHandler
implements ICommandHandler<UpdateAdminUserStatusCommand, AdminUserDto> {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: UpdateAdminUserStatusCommand): Promise<AdminUserDto> {
    const em = this.entityManager.fork();
    const user = await em.findOne(User, { id: command.id, isAnonymous: false }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    if (
      command.input.status === 'suspended'
      && (PROTECTED_ADMIN_ROLES.has(user.role ?? '') || user.id === this.getCurrentUserId())
    ) {
      throw new ApplicationError({ code: 'ADMIN_SUSPENSION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }

    user.banned = command.input.status === 'suspended';
    user.banReason = command.input.status === 'suspended' ? 'Suspended by administrator' : null;
    user.banExpires = null;

    if (command.input.status === 'suspended') {
      await em.nativeDelete(Session, { user: user.id });
    }

    await em.flush();
    return new AdminUserDto(user);
  }

  private getCurrentUserId(): string | null {
    const currentUser = this.cls.get('user');
    if (
      !currentUser
      || typeof currentUser !== 'object'
      || !('id' in currentUser)
      || typeof currentUser.id !== 'string'
    ) {
      return null;
    }

    return currentUser.id;
  }
}
