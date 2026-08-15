import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { ImpersonationTokenResponseDto, UserProfileResponseDto } from '#/modules/auth/dto';

import { BanUserCommand, DeleteUserCommand, ImpersonateUserCommand, ResetUserPasswordCommand, ResetUserTwoFactorCommand, RestoreUserCommand, UnbanUserCommand, UpdateUserRoleCommand } from './commands';
import { BanUserRequestDto, GetUsersRequestDto, GetUsersResponseDto, ResetPasswordResponseDto, UpdateUserRoleRequestDto, UserActionResponseDto, UserDetailDto, UserOverviewDto } from './dto';
import { GetUserByIdQuery, GetUserOverviewQuery, GetUsersQuery } from './queries';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permission('user:read')
  @Get()
  @SwaggerApiResponse(GetUsersResponseDto)
  async getUsers(@Query() query: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Permission('user:read')
  @Get('overview')
  @SwaggerApiResponse(UserOverviewDto)
  async getUserOverview(): Promise<UserOverviewDto> {
    return this.queryBus.execute(new GetUserOverviewQuery());
  }

  @Permission('user:read')
  @Get(':id')
  @SwaggerApiResponse(UserDetailDto)
  async getUserById(@Param('id') id: string): Promise<UserDetailDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @Permission('user:update')
  @Post(':id/ban')
  @SwaggerApiResponse(UserDetailDto)
  async banUser(
    @Param('id') id: string,
    @Body() input: BanUserRequestDto,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new BanUserCommand(id, input, currentUser.id));
  }

  @Permission('user:update')
  @Post(':id/unban')
  @SwaggerApiResponse(UserDetailDto)
  async unbanUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new UnbanUserCommand(id, currentUser.id));
  }

  @Permission('user:delete')
  @Delete(':id')
  @SwaggerApiResponse(UserDetailDto)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new DeleteUserCommand(id, currentUser.id));
  }

  @Permission('user:delete')
  @Post(':id/restore')
  @SwaggerApiResponse(UserDetailDto)
  async restoreUser(@Param('id') id: string): Promise<UserDetailDto> {
    return this.commandBus.execute(new RestoreUserCommand(id));
  }

  @Permission('user:update')
  @Patch(':id/role')
  @SwaggerApiResponse(UserDetailDto)
  async updateUserRole(
    @Param('id') id: string,
    @Body() input: UpdateUserRoleRequestDto,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<UserDetailDto> {
    return this.commandBus.execute(new UpdateUserRoleCommand(id, input.role, currentUser.id));
  }

  @Permission('user:update')
  @Post(':id/password/reset')
  @SwaggerApiResponse(ResetPasswordResponseDto)
  async resetUserPassword(@Param('id') id: string): Promise<ResetPasswordResponseDto> {
    return this.commandBus.execute(new ResetUserPasswordCommand(id));
  }

  @Permission('user:update')
  @Post(':id/2fa/reset')
  @SwaggerApiResponse(UserActionResponseDto)
  async resetUserTwoFactor(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new ResetUserTwoFactorCommand(id));
  }

  @Permission('user:update')
  @Post(':id/impersonate')
  @SwaggerApiResponse(ImpersonationTokenResponseDto)
  async impersonateUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<ImpersonationTokenResponseDto> {
    return this.commandBus.execute(new ImpersonateUserCommand(id, currentUser));
  }
}
