import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetOperatorOverviewResponseDto } from '#/modules/operators/interfaces';
import { GetOperatorOverviewQuery } from '#/modules/operators/queries';

@Injectable()
@QueryHandler(GetOperatorOverviewQuery)
export class GetOperatorOverviewHandler implements IQueryHandler<GetOperatorOverviewQuery, GetOperatorOverviewResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetOperatorOverviewResponseDto> {
    const [totalOperators, activeOperators, bannedOperators, deletedOperators, twoFactorEnabledOperators] = await Promise.all([
      this.em.count(User, {}, { filters: false }),
      this.em.count(User, { deletedAt: null, $or: [{ banned: false, $or: [{ banExpires: null }, { banExpires: { $lte: new Date() } }] }, { banned: true, banExpires: { $lte: new Date() } }] }, { filters: false }),
      this.em.count(User, { deletedAt: null, $or: [{ banned: true, $or: [{ banExpires: null }, { banExpires: { $gt: new Date() } }] }, { banExpires: { $gt: new Date() } }] }, { filters: false }),
      this.em.count(User, { deletedAt: { $ne: null } }, { filters: false }),
      this.em.count(User, { deletedAt: null, twoFactorEnabled: true }, { filters: false }),
    ]);

    return GetOperatorOverviewResponseDto.fromPlain({
      totalOperators,
      activeOperators,
      bannedOperators,
      deletedOperators,
      twoFactorEnabledOperators,
    });
  }
}
