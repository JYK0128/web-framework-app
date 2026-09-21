import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetUserOverviewResponseDto } from '#/modules/users/interfaces';
import { GetUserOverviewQuery } from '#/modules/users/queries';

@Injectable()
@QueryHandler(GetUserOverviewQuery)
export class GetUserOverviewHandler implements IQueryHandler<GetUserOverviewQuery, GetUserOverviewResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetUserOverviewResponseDto> {
    const [totalUsers, activeUsers, bannedUsers, deletedUsers, twoFactorEnabledUsers] = await Promise.all([
      this.em.count(User, {}, { filters: false }),
      this.em.count(User, { deletedAt: null, $or: [{ banned: false, $or: [{ banExpires: null }, { banExpires: { $lte: new Date() } }] }, { banned: true, banExpires: { $lte: new Date() } }] }, { filters: false }),
      this.em.count(User, { deletedAt: null, $or: [{ banned: true, $or: [{ banExpires: null }, { banExpires: { $gt: new Date() } }] }, { banExpires: { $gt: new Date() } }] }, { filters: false }),
      this.em.count(User, { deletedAt: { $ne: null } }, { filters: false }),
      this.em.count(User, { deletedAt: null, twoFactorEnabled: true }, { filters: false }),
    ]);

    return GetUserOverviewResponseDto.fromPlain({
      totalUsers,
      activeUsers,
      bannedUsers,
      deletedUsers,
      twoFactorEnabledUsers,
    });
  }
}
