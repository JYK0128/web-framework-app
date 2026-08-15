import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppEntityManager, type PageResult } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { GetUsersRequestDto, GetUsersResponseDto, UserDetailDto } from '#/modules/users/dto';
import { GetUsersQuery } from '#/modules/users/queries/get-users.query';

@Injectable()
@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery, GetUsersResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetUsersQuery): Promise<GetUsersResponseDto> {
    const pageResult = await this.identifyUsers(query.query);
    const accounts = await this.identifyAccounts(pageResult.items);

    return this.process(pageResult, accounts);
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

  private process(pageResult: PageResult<User>, accounts: Account[]): GetUsersResponseDto {
    const accountsByUserId = new Map<string, Account[]>();
    for (const account of accounts) {
      const list = accountsByUserId.get(account.user.id) ?? [];
      list.push(account);
      accountsByUserId.set(account.user.id, list);
    }

    return {
      ...pageResult,
      items: pageResult.items.map((user) => new UserDetailDto(user, accountsByUserId.get(user.id) ?? [])),
    };
  }
}
