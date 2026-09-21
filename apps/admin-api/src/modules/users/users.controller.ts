import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { BanUserCommand, CreateUserCommand, DeleteUserCommand, ResetUserTwoFactorCommand, RestoreUserCommand, UnbanUserCommand, UpdateUserRoleCommand } from './commands';
import { BanUserRequestDto, CreateUserRequestDto, CreateUserResponseDto, GetUserByIdResponseDto, GetUserOverviewResponseDto, GetUsersRequestDto, GetUsersResponseDto, UpdateUserRoleRequestDto, UserActionResponseDto } from './interfaces';
import { GetUserByIdQuery, GetUserOverviewQuery, GetUsersQuery } from './queries';

@ApiTags('users')
@UserAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @Permission('user:read')
  @Get()
  @SwaggerApiResponse(GetUsersResponseDto)
  async getUsers(@Query() query: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Permission('user:create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateUserResponseDto, HttpStatus.CREATED)
  async createUser(@Body() input: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    return this.commandBus.execute(new CreateUserCommand(input));
  }

  @Permission('user:read')
  @Get('overview')
  @SwaggerApiResponse(GetUserOverviewResponseDto)
  async getUserOverview(): Promise<GetUserOverviewResponseDto> {
    return this.queryBus.execute(new GetUserOverviewQuery());
  }

  @Permission('user:read')
  @Get(':id')
  @SwaggerApiResponse(GetUserByIdResponseDto)
  async getUserById(@Param('id') id: string): Promise<GetUserByIdResponseDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @Permission('user:update')
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UserActionResponseDto)
  async banUser(@Param('id') id: string, @Body() input: BanUserRequestDto): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new BanUserCommand({ userId: id, data: input }));
  }

  @Permission('user:update')
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UserActionResponseDto)
  async unbanUser(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new UnbanUserCommand(id));
  }

  @Permission('user:update')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UserActionResponseDto)
  async deleteUser(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }

  @Permission('user:update')
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UserActionResponseDto)
  async restoreUser(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new RestoreUserCommand(id));
  }

  @Permission('user:update')
  @Patch(':id/role')
  @SwaggerApiResponse(UserActionResponseDto)
  async updateUserRole(@Param('id') id: string, @Body() input: UpdateUserRoleRequestDto): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new UpdateUserRoleCommand({ userId: id, data: input }));
  }

  @Permission('user:update')
  @Post(':id/2fa/reset')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(UserActionResponseDto)
  async resetUserTwoFactor(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new ResetUserTwoFactorCommand(id));
  }
}
