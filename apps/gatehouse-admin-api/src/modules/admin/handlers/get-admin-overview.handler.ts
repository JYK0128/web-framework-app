import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SERVICE_DATABASE_CONTEXT } from '#/database/service-mikro-orm.config';
import { User } from '#/entities/auth/user.entity';
import { AdminOverviewResponseDto } from '#/modules/admin/admin.dto';
import { GetAdminOverviewQuery } from '#/modules/admin/queries';

@Injectable()
@QueryHandler(GetAdminOverviewQuery)
export class GetAdminOverviewHandler implements IQueryHandler<GetAdminOverviewQuery, AdminOverviewResponseDto> {
  constructor(@InjectEntityManager(SERVICE_DATABASE_CONTEXT) private readonly serviceEm: EntityManager) {}

  async execute(): Promise<AdminOverviewResponseDto> {
    const em = this.serviceEm.fork();
    const totalUsers = await em.count(User, { isAnonymous: false }, { filters: false });
    const activeUsers = await em.count(User, { isAnonymous: false, deletedAt: null }, { filters: false });
    const suspendedUsers = await em.count(
      User,
      { isAnonymous: false, deletedAt: { $ne: null } },
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
