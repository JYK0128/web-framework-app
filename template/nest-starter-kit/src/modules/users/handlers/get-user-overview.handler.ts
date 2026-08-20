import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { UserOverviewDto } from '#/modules/users/dto';
import { GetUserOverviewQuery } from '#/modules/users/queries/get-user-overview.query';

@Injectable()
@QueryHandler(GetUserOverviewQuery)
export class GetUserOverviewHandler implements IQueryHandler<GetUserOverviewQuery, UserOverviewDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(_query: GetUserOverviewQuery): Promise<UserOverviewDto> {
    const totalUsers = await this.identifyTotalUsers();
    const adminUsers = await this.identifyAdminUsers();
    const twoFactorEnabledUsers = await this.identifyTwoFactorUsers();
    const regularUsers = await this.identifyRegularUsers();

    return this.process(totalUsers, adminUsers, twoFactorEnabledUsers, regularUsers);
  }

  private async identifyTotalUsers(): Promise<number> {
    return this.em.count(User, {}, { filters: false });
  }

  private async identifyAdminUsers(): Promise<number> {
    return this.em.count(User, { role: RoleName.ADMIN }, { filters: false });
  }

  private async identifyTwoFactorUsers(): Promise<number> {
    return this.em.count(User, { twoFactorEnabled: true }, { filters: false });
  }

  private async identifyRegularUsers(): Promise<number> {
    return this.em.count(User, { role: RoleName.USER }, { filters: false });
  }

  private process(
    totalUsers: number,
    adminUsers: number,
    twoFactorEnabledUsers: number,
    regularUsers: number,
  ): UserOverviewDto {
    return new UserOverviewDto(totalUsers, adminUsers, twoFactorEnabledUsers, regularUsers);
  }
}
