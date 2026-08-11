import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';

import { AdminOverviewResponseDto, AdminUpdateUserStatusRequestDto, AdminUserDto, AdminUsersQueryDto, AdminUsersResponseDto } from './admin.dto';
import { UpdateAdminUserStatusCommand } from './commands';
import { GetAdminOverviewQuery, GetAdminUsersQuery } from './queries';

@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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
}
