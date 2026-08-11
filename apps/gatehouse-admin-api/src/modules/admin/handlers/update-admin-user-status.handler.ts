import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { SERVICE_DATABASE_CONTEXT } from '#/database/service-mikro-orm.config';
import { User } from '#/entities/auth/user.entity';
import { AdminUserDto } from '#/modules/admin/admin.dto';
import { getCurrentUserId, toAdminUserDto } from '#/modules/admin/admin.mapper';
import { UpdateAdminUserStatusCommand } from '#/modules/admin/commands';

@Injectable()
@CommandHandler(UpdateAdminUserStatusCommand)
export class UpdateAdminUserStatusHandler
implements ICommandHandler<UpdateAdminUserStatusCommand, AdminUserDto> {
  constructor(
    @InjectEntityManager(SERVICE_DATABASE_CONTEXT) private readonly serviceEm: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: UpdateAdminUserStatusCommand): Promise<AdminUserDto> {
    const em = this.serviceEm.fork();
    const user = await em.findOne(User, { id: command.id, isAnonymous: false }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    if (user.metadata?.isAdmin === true && command.input.status === 'suspended') {
      throw new ApplicationError({ code: 'ADMIN_SUSPENSION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }

    user.deletedAt = command.input.status === 'suspended' ? new Date() : null;
    user.deletedBy = getCurrentUserId(this.cls);
    await em.flush();
    return toAdminUserDto(user);
  }
}
