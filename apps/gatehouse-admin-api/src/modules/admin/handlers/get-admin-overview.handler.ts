import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AdminOverviewResponseDto } from '#/modules/admin/admin.dto';
import { GetAdminOverviewQuery } from '#/modules/admin/queries';

@Injectable()
@QueryHandler(GetAdminOverviewHandler)
export class GetAdminOverviewHandler implements IQueryHandler<GetAdminOverviewQuery, AdminOverviewResponseDto> {
  constructor(@Inject(EntityManager) private readonly entityManager: EntityManager) {}

  async execute(): Promise<AdminOverviewResponseDto> {
    const em = this.entityManager.fork();
    const totalUsers = await em.count(User, { isAnonymous: false }, { filters: false });
    const now = new Date();
    const activeUsers = await em.count(
      User,
      {
        isAnonymous: false,
        $or: [
          { banned: false },
          { banned: true, banExpires: null },
          { banned: true, banExpires: { $lte: now } },
        ],
      },
      { filters: false },
    );
    const suspendedUsers = await em.count(
      User,
      { isAnonymous: false, banned: true, $or: [{ banExpires: null }, { banExpires: { $gt: now } }] },
      { filters: false },
    );
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newUsersToday = await em.count(
      User,
      { isAnonymous: false, createdAt: { $gte: startOfDay } },
      { filters: false },
    );

    return { totalUsers, activeUsers, suspendedUsers, newUsersToday };
  }
}
