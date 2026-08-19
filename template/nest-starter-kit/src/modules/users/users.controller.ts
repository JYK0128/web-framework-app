import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import type { AuthPrincipal } from '#/common/security/auth-token.types';

import { BanUserCommand, DeleteUserCommand, ResetUserPasswordCommand, ResetUserTwoFactorCommand, RestoreUserCommand, UnbanUserCommand, UpdateUserRoleCommand } from './commands';
import { BanUserRequestDto, GetUsersRequestDto, GetUsersResponseDto, ResetPasswordResponseDto, UpdateUserRoleRequestDto, UserActionResponseDto, UserDetailDto, UserOverviewDto } from './dto';
import { GetUserByIdQuery, GetUserOverviewQuery, GetUsersQuery } from './queries';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permission('user:manage', 'user:read')
  @Get()
  @SwaggerApiResponse(GetUsersResponseDto)
  async getUsers(@Query() query: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Permission('user:manage', 'user:read')
  @Get('overview')
  @SwaggerApiResponse(UserOverviewDto)
  async getUserOverview(): Promise<UserOverviewDto> {
    return this.queryBus.execute(new GetUserOverviewQuery());
  }

  @Permission('user:manage', 'user:read')
  @Get(':id')
  @SwaggerApiResponse(UserDetailDto)
  async getUserById(@Param('id') id: string): Promise<UserDetailDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/ban')
  @SwaggerApiResponse(UserDetailDto)
  async banUser(
    @Param('id') id: string,
    @Body() input: BanUserRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new BanUserCommand(id, input, currentUser.id));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/unban')
  @SwaggerApiResponse(UserDetailDto)
  async unbanUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new UnbanUserCommand(id, currentUser.id));
  }

  @Permission('user:manage', 'user:delete')
  @Delete(':id')
  @SwaggerApiResponse(UserDetailDto)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new DeleteUserCommand(id, currentUser.id));
  }

  @Permission('user:manage', 'user:delete')
  @Post(':id/restore')
  @SwaggerApiResponse(UserDetailDto)
  async restoreUser(@Param('id') id: string): Promise<UserDetailDto> {
    return this.commandBus.execute(new RestoreUserCommand(id));
  }

  @Permission('user:manage', 'user:update')
  @Patch(':id/role')
  @SwaggerApiResponse(UserDetailDto)
  async updateUserRole(
    @Param('id') id: string,
    @Body() input: UpdateUserRoleRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new UpdateUserRoleCommand(id, input.role, currentUser.id));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/password/reset')
  @SwaggerApiResponse(ResetPasswordResponseDto)
  async resetUserPassword(@Param('id') id: string): Promise<ResetPasswordResponseDto> {
    return this.commandBus.execute(new ResetUserPasswordCommand(id));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/2fa/reset')
  @SwaggerApiResponse(UserActionResponseDto)
  async resetUserTwoFactor(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new ResetUserTwoFactorCommand(id));
  }
}
