import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SERVICE_DATABASE_CONTEXT } from '#/database/service-mikro-orm.config';
import { Session } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';
import { UpdateServiceUserStatusCommand } from '#/modules/admin/commands';
import { ServiceUserDto } from '#/modules/admin/service-user.dto';
import { toServiceUserDto } from '#/modules/admin/service-user.mapper';

@Injectable()
@CommandHandler(UpdateServiceUserStatusCommand)
export class UpdateServiceUserStatusHandler
implements ICommandHandler<UpdateServiceUserStatusCommand, ServiceUserDto> {
  constructor(@InjectEntityManager(SERVICE_DATABASE_CONTEXT) private readonly entityManager: EntityManager) {}

  async execute(command: UpdateServiceUserStatusCommand): Promise<ServiceUserDto> {
    const em = this.entityManager.fork();
    const user = await em.findOne(User, { id: command.id, isAnonymous: false, role: 'user' }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    user.banned = command.input.status === 'suspended';
    user.banReason = command.input.status === 'suspended' ? 'Suspended by administrator' : null;
    user.banExpires = null;

    if (command.input.status === 'suspended') {
      await em.nativeDelete(Session, { user: user.id });
    }

    await em.flush();
    return toServiceUserDto(user);
  }
}
