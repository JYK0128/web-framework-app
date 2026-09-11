import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetUserByIdResponseDto } from '#/modules/users/dto';
import { GetUserByIdQuery } from '#/modules/users/queries/get-user-by-id.query';

@Injectable()
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, GetUserByIdResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<GetUserByIdResponseDto> {
    const user = await this.identifyUser(query.input.id);
    const accounts = await this.identifyAccounts(user.id);
    const policy = await this.systemContext.getAuthPolicy();
    this.verify(user, accounts, policy.passwordExpirationDays);
    return this.process(user, accounts, policy.passwordExpirationDays);
  }

  private verify(user: User, accounts: Account[], expirationDays: number): void {
    if (!user || !Array.isArray(accounts) || !Number.isFinite(expirationDays)) {
      throw new Error('사용자 상세 정보를 확인할 수 없습니다.');
    }
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

  private process(user: User, accounts: Account[], expirationDays: number): GetUserByIdResponseDto {
    return GetUserByIdResponseDto.fromDetail(user, accounts, expirationDays);
  }
}
