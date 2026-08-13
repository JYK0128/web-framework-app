import { EntityManager, type ObjectQuery } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AdminUserDto, AdminUsersResponseDto } from '#/modules/admin/admin.dto';
import { GetAdminUsersQuery } from '#/modules/admin/queries';

@Injectable()
@QueryHandler(GetAdminUsersQuery)
export class GetAdminUsersHandler implements IQueryHandler<GetAdminUsersQuery, AdminUsersResponseDto> {
  constructor(@Inject(EntityManager) private readonly entityManager: EntityManager) {}

  async execute(query: GetAdminUsersQuery): Promise<AdminUsersResponseDto> {
    const em = this.entityManager.fork();
    const where: ObjectQuery<User> = {};
    const now = new Date();
    const filters: ObjectQuery<User>[] = [];

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

    if (filters.length > 0) where.$and = filters;

    const [users, total] = await em.findAndCount(User, where, {
      filters: false,
      limit: query.input.limit,
      orderBy: { createdAt: 'DESC' },
    });

    return { users: users.map((user) => new AdminUserDto(user)), total };
  }
}
