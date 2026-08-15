import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { AppEntityManager } from '#/database/entity-manager';
import { Role, RoleName } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';
import { UserProfileQuery } from '#/modules/auth/queries/user-profile.query';

@Injectable()
@QueryHandler(UserProfileQuery)
export class UserProfileHandler implements IQueryHandler<UserProfileQuery, UserProfileResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_query: UserProfileQuery): Promise<UserProfileResponseDto> {
    const user = await this.identifyUser();
    const account = await this.identifyAccount(user.id);
    const role = user.role ? await this.identifyRole(user.role) : null;

    return this.process(user, account, role);
  }

  private async identifyUser(): Promise<User> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return user;
  }

  private async identifyAccount(userId: string): Promise<Account | null> {
    return this.em.findOne(Account, {
      user: userId,
      accountId: userId,
      providerId: 'credential',
    });
  }

  private async identifyRole(roleName: string): Promise<Role | null> {
    return this.em.findOne(Role, { name: roleName as RoleName });
  }

  private process(user: User, account: Account | null, role: Role | null): UserProfileResponseDto {
    return new UserProfileResponseDto(user, account?.metadata, role?.permissions);
  }
}
