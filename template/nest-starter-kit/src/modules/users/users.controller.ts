import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { BanUserCommand, DeleteUserCommand, ResetUserPasswordCommand, ResetUserTwoFactorCommand, RestoreUserCommand, UnbanUserCommand, UpdateUserRoleCommand } from './commands';
import { BanUserRequestDto, BanUserResponseDto, DeleteUserResponseDto, GetUserByIdResponseDto, GetUserOverviewResponseDto, GetUsersRequestDto, GetUsersResponseDto, ResetPasswordResponseDto, ResetUserTwoFactorResponseDto, RestoreUserResponseDto, UnbanUserResponseDto, UpdateUserRoleRequestDto, UpdateUserRoleResponseDto } from './dto';
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
  @SwaggerApiResponse(GetUserOverviewResponseDto)
  async getUserOverview(): Promise<GetUserOverviewResponseDto> {
    return this.queryBus.execute(new GetUserOverviewQuery());
  }

  @Permission('user:manage', 'user:read')
  @Get(':id')
  @SwaggerApiResponse(GetUserByIdResponseDto)
  async getUserById(@Param('id') id: string): Promise<GetUserByIdResponseDto> {
    return this.queryBus.execute(new GetUserByIdQuery({ id }));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(BanUserResponseDto)
  async banUser(
    @Param('id') id: string,
    @Body() input: BanUserRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<BanUserResponseDto> {
    return this.commandBus.execute(new BanUserCommand({ id, input, currentUserId: currentUser.id }));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UnbanUserResponseDto)
  async unbanUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UnbanUserResponseDto> {
    return this.commandBus.execute(new UnbanUserCommand({ id, currentUserId: currentUser.id }));
  }

  @Permission('user:manage', 'user:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteUserResponseDto)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<DeleteUserResponseDto> {
    return this.commandBus.execute(new DeleteUserCommand({ id, currentUserId: currentUser.id }));
  }

  @Permission('user:manage', 'user:delete')
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(RestoreUserResponseDto)
  async restoreUser(@Param('id') id: string): Promise<RestoreUserResponseDto> {
    return this.commandBus.execute(new RestoreUserCommand({ id }));
  }

  @Permission('user:manage', 'user:update')
  @Patch(':id/role')
  @SwaggerApiResponse(UpdateUserRoleResponseDto)
  async updateUserRole(
    @Param('id') id: string,
    @Body() input: UpdateUserRoleRequestDto,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<UpdateUserRoleResponseDto> {
    return this.commandBus.execute(new UpdateUserRoleCommand({ id, role: input.role, currentUserId: currentUser.id }));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/password/reset')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(ResetPasswordResponseDto)
  async resetUserPassword(@Param('id') id: string): Promise<ResetPasswordResponseDto> {
    return this.commandBus.execute(new ResetUserPasswordCommand({ id }));
  }

  @Permission('user:manage', 'user:update')
  @Post(':id/2fa/reset')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(ResetUserTwoFactorResponseDto)
  async resetUserTwoFactor(@Param('id') id: string): Promise<ResetUserTwoFactorResponseDto> {
    return this.commandBus.execute(new ResetUserTwoFactorCommand({ id }));
  }
}
