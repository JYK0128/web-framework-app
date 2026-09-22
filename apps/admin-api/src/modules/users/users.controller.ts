import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { BanUserCommand, CreateUserCommand, DeleteUserCommand, ResetUserTwoFactorCommand, RestoreUserCommand, UnbanUserCommand, UpdateUserRoleCommand } from './commands';
import { BanUserRequestDto, CreateUserRequestDto, CreateUserResponseDto, GetUserByIdResponseDto, GetUserOverviewResponseDto, GetUsersRequestDto, GetUsersResponseDto, UpdateUserRoleRequestDto, UserActionResponseDto } from './interfaces';
import { GetUserByIdQuery, GetUserOverviewQuery, GetUsersQuery } from './queries';

@ApiTags('users')
@UserAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @Permissions(Permission.user.read)
  @Get()
  @ApiOperation({ summary: '관리자 목록 조회' })
  @SwaggerApiResponse(GetUsersResponseDto)
  async getUsers(@Query() query: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Permissions(Permission.user.create)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '관리자 생성' })
  @SwaggerApiResponse(CreateUserResponseDto, HttpStatus.CREATED)
  async createUser(@Body() input: CreateUserRequestDto): Promise<CreateUserResponseDto> {
    return this.commandBus.execute(new CreateUserCommand(input));
  }

  @Permissions(Permission.user.read)
  @Get('overview')
  @ApiOperation({ summary: '관리자 현황 조회' })
  @SwaggerApiResponse(GetUserOverviewResponseDto)
  async getUserOverview(): Promise<GetUserOverviewResponseDto> {
    return this.queryBus.execute(new GetUserOverviewQuery());
  }

  @Permissions(Permission.user.read)
  @Get(':id')
  @ApiOperation({ summary: '관리자 상세 조회' })
  @SwaggerApiResponse(GetUserByIdResponseDto)
  async getUserById(@Param('id') id: string): Promise<GetUserByIdResponseDto> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  @Permissions(Permission.user.update)
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 이용 정지' })
  @SwaggerApiResponse(UserActionResponseDto)
  async banUser(@Param('id') id: string, @Body() input: BanUserRequestDto): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new BanUserCommand({ userId: id, data: input }));
  }

  @Permissions(Permission.user.update)
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 이용 정지 해제' })
  @SwaggerApiResponse(UserActionResponseDto)
  async unbanUser(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new UnbanUserCommand(id));
  }

  @Permissions(Permission.user.update)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 삭제' })
  @SwaggerApiResponse(UserActionResponseDto)
  async deleteUser(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }

  @Permissions(Permission.user.update)
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 복구' })
  @SwaggerApiResponse(UserActionResponseDto)
  async restoreUser(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new RestoreUserCommand(id));
  }

  @Permissions(Permission.user.update)
  @Patch(':id/role')
  @ApiOperation({ summary: '관리자 역할 변경' })
  @SwaggerApiResponse(UserActionResponseDto)
  async updateUserRole(@Param('id') id: string, @Body() input: UpdateUserRoleRequestDto): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new UpdateUserRoleCommand({ userId: id, data: input }));
  }

  @Permissions(Permission.user.update)
  @Post(':id/2fa/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 2단계 인증 초기화' })
  @SwaggerApiResponse(UserActionResponseDto)
  async resetUserTwoFactor(@Param('id') id: string): Promise<UserActionResponseDto> {
    return this.commandBus.execute(new ResetUserTwoFactorCommand(id));
  }
}
