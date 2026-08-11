import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SERVICE_DATABASE_CONTEXT } from '#/database/service-mikro-orm.config';
import { ROLE_NAMES } from '#/entities/auth/role.entity';
import { User } from '#/entities/auth/user.entity';
import { GetServiceOverviewQuery } from '#/modules/admin/queries';
import { ServiceOverviewResponseDto } from '#/modules/admin/service-user.dto';

@Injectable()
@QueryHandler(GetServiceOverviewQuery)
export class GetServiceOverviewHandler implements IQueryHandler<GetServiceOverviewQuery, ServiceOverviewResponseDto> {
  constructor(@InjectEntityManager(SERVICE_DATABASE_CONTEXT) private readonly entityManager: EntityManager) {}

  async execute(): Promise<ServiceOverviewResponseDto> {
    const em = this.entityManager.fork();
    const now = new Date();
    const totalUsers = await em.count(User, { isAnonymous: false, role: ROLE_NAMES.USER }, { filters: false });
    const activeUsers = await em.count(
      User,
      {
        isAnonymous: false,
        role: ROLE_NAMES.USER,
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
      {
        isAnonymous: false,
        role: ROLE_NAMES.USER,
        banned: true,
        $or: [{ banExpires: null }, { banExpires: { $gt: now } }],
      },
      { filters: false },
    );
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newUsersToday = await em.count(
      User,
      { isAnonymous: false, role: ROLE_NAMES.USER, createdAt: { $gte: startOfDay } },
      { filters: false },
    );

    return { totalUsers, activeUsers, suspendedUsers, newUsersToday };
  }
}
