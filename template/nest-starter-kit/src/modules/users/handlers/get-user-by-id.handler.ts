import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { UserDetailDto } from '#/modules/users/dto';
import { GetUserByIdQuery } from '#/modules/users/queries/get-user-by-id.query';

@Injectable()
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, UserDetailDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetUserByIdQuery): Promise<UserDetailDto> {
    const user = await this.identifyUser(query.id);
    const accounts = await this.identifyAccounts(user.id);
    return this.process(user, accounts);
  }

  private async identifyUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private async identifyAccounts(userId: string): Promise<Account[]> {
    return this.em.find(Account, { user: userId }, { filters: false });
  }

  private process(user: User, accounts: Account[]): UserDetailDto {
    return new UserDetailDto(user, accounts);
  }
}
