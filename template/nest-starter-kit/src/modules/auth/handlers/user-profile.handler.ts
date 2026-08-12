import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Role } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';
import { UserProfileQuery } from '#/modules/auth/queries/user-profile.query';

@Injectable()
@QueryHandler(UserProfileQuery)
export class UserProfileHandler implements IQueryHandler<UserProfileQuery, UserProfileResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_query: UserProfileQuery): Promise<UserProfileResponseDto> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const account = await this.em.findOne(Account, {
      user: user.id,
      accountId: user.id,
      providerId: 'credential',
    });
    const role = user.role ? await this.em.findOne(Role, { name: user.role }) : null;

    return new UserProfileResponseDto(user, account?.metadata, role?.permissions);
  }
}
