import { Controller, Get, HttpStatus, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AccessTokenService, type AuthLevel } from '#/common/security/access-token.service';
import { AppEntityManager } from '#/database/entity-manager';
import { ROLE_NAMES } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';
import { ImpersonationTokenResponseDto, UserProfileResponseDto } from '#/modules/auth/dto';

import { GetUsersRequestDto, GetUsersResponseDto, UserItemDto, UserOverviewDto } from './dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(AppEntityManager)
    private readonly em: AppEntityManager,
    private readonly accessTokenService: AccessTokenService,
    private readonly cls: ClsService,
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
  @Get('overview')
  @SwaggerApiResponse(UserOverviewDto)
  async getUserOverview(): Promise<UserOverviewDto> {
    const [totalUsers, adminUsers, twoFactorEnabledUsers] = await Promise.all([
      this.em.count(User, {}),
      this.em.count(User, { role: ROLE_NAMES.ADMIN }),
      this.em.count(User, { twoFactorEnabled: true }),
    ]);

    return {
      totalUsers,
      adminUsers,
      twoFactorEnabledUsers,
      regularUsers: Math.max(0, totalUsers - adminUsers),
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
  @SwaggerApiResponse(ImpersonationTokenResponseDto)
  async impersonateUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<ImpersonationTokenResponseDto> {
    if (this.cls.get('impersonatedBy')) {
      throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }

    const targetUser = await this.em.findOne(User, { id }, { filters: false });
    if (!targetUser) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (
      targetUser.id === currentUser.id
      || targetUser.isBanned
      || targetUser.isDeleted
      || targetUser.role?.toString() === ROLE_NAMES.ADMIN
    ) {
      throw new ApplicationError({ code: 'IMPERSONATION_NOT_ALLOWED', status: HttpStatus.BAD_REQUEST });
    }

    return {
      userId: targetUser.id,
      user: new UserProfileResponseDto(targetUser),
      ...await this.accessTokenService.issueTokenPair(targetUser.id, {
        authLevel: this.cls.get<AuthLevel>('authLevel'),
        impersonatedBy: currentUser.id,
      }),
    };
  }
}
