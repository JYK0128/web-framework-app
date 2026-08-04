import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { requestContext } from '#/common/context/request-context';
import { Session } from '#/entities/auth/session.entity';
import { LogoutCommand } from '#/modules/auth/commands/logout.command';

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: LogoutCommand): Promise<void> {
    const token = command.token;
    if (!token) return;

    const session = await this.em.findOne(Session, { token }, { populate: ['user'] });
    if (!session) return;

    requestContext.setActorId(session.user.id);
    this.em.remove(session);
  }
}
