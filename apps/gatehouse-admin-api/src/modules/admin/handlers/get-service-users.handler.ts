import type { EntityManager, ObjectQuery } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SERVICE_DATABASE_CONTEXT } from '#/database/service-mikro-orm.config';
import { User } from '#/entities/auth/user.entity';
import { GetServiceUsersQuery } from '#/modules/admin/queries';
import { ServiceUsersResponseDto } from '#/modules/admin/service-user.dto';
import { toServiceUserDto } from '#/modules/admin/service-user.mapper';

@Injectable()
@QueryHandler(GetServiceUsersQuery)
export class GetServiceUsersHandler implements IQueryHandler<GetServiceUsersQuery, ServiceUsersResponseDto> {
  constructor(@InjectEntityManager(SERVICE_DATABASE_CONTEXT) private readonly entityManager: EntityManager) {}

  async execute(query: GetServiceUsersQuery): Promise<ServiceUsersResponseDto> {
    const em = this.entityManager.fork();
    const where: ObjectQuery<User> = { isAnonymous: false };
    const now = new Date();
    const filters: ObjectQuery<User>[] = [{ role: 'user' }];

    if (query.input.status === 'active') {
      filters.push({
        $or: [
          { banned: false },
          { banned: true, banExpires: null },
          { banned: true, banExpires: { $lte: now } },
        ],
      });
    }
    if (query.input.status === 'suspended') {
      filters.push({ banned: true, $or: [{ banExpires: null }, { banExpires: { $gt: now } }] });
    }

    const search = query.input.search?.trim();
    if (search) {
      filters.push({
        $or: [
          { name: { $like: `%${search}%` } },
          { email: { $like: `%${search.toLowerCase()}%` } },
        ],
      });
    }

    where.$and = filters;
    const [users, total] = await em.findAndCount(User, where, {
      filters: false,
      limit: query.input.limit,
      orderBy: { createdAt: 'DESC' },
    });

    return { users: users.map(toServiceUserDto), total };
  }
}
