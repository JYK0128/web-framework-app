import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

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
      throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.UNAUTHORIZED });
    }

    return new UserProfileResponseDto(user);
  }
}
