import { Controller, Get, HttpStatus, Inject, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { IMPERSONATION_SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SessionStore } from '#/common/security/session.store';
import { AppEntityManager } from '#/database/entity-manager';
import { User } from '#/entities/auth/user.entity';
import { UserProfileResponseDto, UserProfileSessionResponseDto } from '#/modules/auth/dto';

import { GetUsersRequestDto, GetUsersResponseDto, UserItemDto } from './dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(AppEntityManager)
    private readonly em: AppEntityManager,
    private readonly sessionStore: SessionStore,
  ) {}

  @Permission('user:read')
  @Get()
  @SwaggerApiResponse(GetUsersResponseDto)
  async getUsers(@Query() query: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    const pageResult = await this.em.findByPage(
      User,
      query.toFilterQuery(),
      query.toPageOptions(),
    );

    const items: UserItemDto[] = pageResult.items.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role ?? 'user',
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return {
      ...pageResult,
      items,
    };
  }

  @Permission('user:read')
  @Get(':id')
  @SwaggerApiResponse(UserItemDto)
  async getUserById(@Param('id') id: string): Promise<UserItemDto> {
    const u = await this.em.findOne(User, { id });
    if (!u) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role ?? 'user',
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }

  @Permission('user:update')
  @Post(':id/impersonate')
  @SwaggerApiResponse(UserProfileSessionResponseDto)
  async impersonateUser(
    @Param('id') id: string,
    @Req() request: Request,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserProfileSessionResponseDto> {
    const result = await this.sessionStore.startImpersonation(request.sessionID, id, currentUser.id);
    request.session.cookie.maxAge = IMPERSONATION_SESSION_TTL_SECONDS * 1000;
    return {
      user: new UserProfileResponseDto(result.user),
      expiresAt: result.expiresAt,
    };
  }
}
