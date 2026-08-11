import type { EntityManager, ObjectQuery } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SERVICE_DATABASE_CONTEXT } from '#/database/service-mikro-orm.config';
import { User } from '#/entities/auth/user.entity';
import { AdminUsersResponseDto } from '#/modules/admin/admin.dto';
import { toAdminUserDto } from '#/modules/admin/admin.mapper';
import { GetAdminUsersQuery } from '#/modules/admin/queries';

@Injectable()
@QueryHandler(GetAdminUsersQuery)
export class GetAdminUsersHandler implements IQueryHandler<GetAdminUsersQuery, AdminUsersResponseDto> {
  constructor(@InjectEntityManager(SERVICE_DATABASE_CONTEXT) private readonly serviceEm: EntityManager) {}

  async execute(query: GetAdminUsersQuery): Promise<AdminUsersResponseDto> {
    const em = this.serviceEm.fork();
    const where: ObjectQuery<User> = { isAnonymous: false };

    if (query.input.status === 'active') where.deletedAt = null;
    if (query.input.status === 'suspended') where.deletedAt = { $ne: null };

    const search = query.input.search?.trim();
    if (search) {
      where.$or = [
        { name: { $like: `%${search}%` } },
        { email: { $like: `%${search.toLowerCase()}%` } },
      ];
    }

    const [users, total] = await em.findAndCount(User, where, {
      filters: false,
      limit: query.input.limit,
      orderBy: { createdAt: 'DESC' },
    });

    return { users: users.map(toAdminUserDto), total };
  }
}
