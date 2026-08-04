import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { requestContext } from '#/common/context/request-context';
import { Session } from '#/entities/auth/session.entity';
import { toPublicUser } from '#/modules/auth/auth.helpers';
import type { PublicUser } from '#/modules/auth/auth.types';
import { GetCurrentUserQuery } from '#/modules/auth/queries/get-current-user.query';

@Injectable()
@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery, PublicUser | null> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(query: GetCurrentUserQuery): Promise<PublicUser | null> {
    const token = query.token;
    if (!token) return null;

    const session = await this.em.findOne(Session, { token }, { populate: ['user'] });
    if (!session) return null;

    if (session.expiresAt.getTime() <= Date.now()) {
      requestContext.setActorId(session.user.id);
      this.em.remove(session);
      return null;
    }

    session.updatedAt = new Date();
    requestContext.setActorId(session.user.id);

    return toPublicUser(session.user);
  }
}
