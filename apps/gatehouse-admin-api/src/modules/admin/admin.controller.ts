import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { IMPERSONATION_SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SessionStore } from '#/common/security/session.store';
import { UserProfileResponseDto, UserProfileSessionResponseDto } from '#/modules/auth/dto';

import { AdminOverviewResponseDto, AdminUpdateUserStatusRequestDto, AdminUserDto, AdminUsersQueryDto, AdminUsersResponseDto } from './admin.dto';
import { UpdateAdminUserStatusCommand, UpdateServiceUserStatusCommand } from './commands';
import { GetAdminOverviewQuery, GetAdminUsersQuery, GetServiceOverviewQuery, GetServiceUsersQuery } from './queries';
import { ServiceOverviewResponseDto, ServiceUpdateUserStatusRequestDto, ServiceUserDto, ServiceUsersQueryDto, ServiceUsersResponseDto } from './service-user.dto';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly sessionStore: SessionStore,
  ) {}

  @Get('overview')
  @Permission('admin:read')
  async getOverview(): Promise<AdminOverviewResponseDto> {
    return this.queryBus.execute(new GetAdminOverviewQuery());
  }

  @Get('users')
  @Permission('admin:read')
  async getUsers(@Query() query: AdminUsersQueryDto): Promise<AdminUsersResponseDto> {
    return this.queryBus.execute(new GetAdminUsersQuery(query));
  }

  @Patch('users/:id/status')
  @Permission('admin:write')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() input: AdminUpdateUserStatusRequestDto,
  ): Promise<AdminUserDto> {
    return this.commandBus.execute(new UpdateAdminUserStatusCommand(id, input));
  }

  @Get('service-overview')
  @Permission('service-user:read')
  async getServiceOverview(): Promise<ServiceOverviewResponseDto> {
    return this.queryBus.execute(new GetServiceOverviewQuery());
  }

  @Get('service-users')
  @Permission('service-user:read')
  async getServiceUsers(@Query() query: ServiceUsersQueryDto): Promise<ServiceUsersResponseDto> {
    return this.queryBus.execute(new GetServiceUsersQuery(query));
  }

  @Patch('service-users/:id/status')
  @Permission('service-user:write')
  async updateServiceUserStatus(
    @Param('id') id: string,
    @Body() input: ServiceUpdateUserStatusRequestDto,
  ): Promise<ServiceUserDto> {
    return this.commandBus.execute(new UpdateServiceUserStatusCommand(id, input));
  }

  @Post('users/:id/impersonate')
  @Permission('admin:write')
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
