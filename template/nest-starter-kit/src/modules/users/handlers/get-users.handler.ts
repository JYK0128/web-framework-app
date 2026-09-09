import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { GetUsersRequestDto, GetUsersResponseDto, UserDetailDto } from '#/modules/users/dto';
import { GetUsersQuery } from '#/modules/users/queries/get-users.query';

@Injectable()
@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery, GetUsersResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(query: GetUsersQuery): Promise<GetUsersResponseDto> {
    const pageResult = await this.identifyUsers(query.input);
    const accounts = await this.identifyAccounts(pageResult.items);

    const policy = await this.systemContext.getAuthPolicy();
    this.verify(pageResult, accounts, policy.passwordExpirationDays);
    return this.process(pageResult, accounts, policy.passwordExpirationDays);
  }

  private verify(pageResult: PageResult<User>, accounts: Account[], expirationDays: number): void {
    if (!Array.isArray(pageResult.items) || !Array.isArray(accounts) || !Number.isFinite(expirationDays)) {
      throw new Error('사용자 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyUsers(query: GetUsersRequestDto): Promise<PageResult<User>> {
    return this.em.findByPage(User, query.toFilterQuery(), {
      ...query.toPageOptions(),
      filters: false,
    });
  }

  private async identifyAccounts(users: User[]): Promise<Account[]> {
    if (users.length === 0) return [];
    return this.em.find(
      Account,
      { user: { $in: users.map((u) => u.id) } },
      { filters: false },
    );
  }

  private process(pageResult: PageResult<User>, accounts: Account[], expirationDays: number): GetUsersResponseDto {
    const accountsByUserId = new Map<string, Account[]>();
    for (const account of accounts) {
      const list = accountsByUserId.get(account.user.id) ?? [];
      list.push(account);
      accountsByUserId.set(account.user.id, list);
    }

    return {
      ...pageResult,
      items: pageResult.items.map((user) => new UserDetailDto(user, accountsByUserId.get(user.id) ?? [], expirationDays)),
    };
  }
}
