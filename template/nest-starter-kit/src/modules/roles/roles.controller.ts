import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateRoleCommand, DeleteRoleCommand, UpdateRolePermissionsCommand } from './commands';
import { CreateRoleRequestDto, CreateRoleResponseDto, DeleteRoleResponseDto, GetRolesResponseDto, UpdateRolePermissionsRequestDto, UpdateRolePermissionsResponseDto } from './dto';
import { GetRolesQuery } from './queries';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permission('role:manage', 'role:read')
  @Get()
  @SwaggerApiResponse(GetRolesResponseDto)
  async getRoles(): Promise<GetRolesResponseDto> {
    return this.queryBus.execute(new GetRolesQuery());
  }

  @Permission('role:manage', 'role:create')
  @Post()
  @SwaggerApiResponse(CreateRoleResponseDto)
  async createRole(
    @Body() dto: CreateRoleRequestDto,
  ): Promise<CreateRoleResponseDto> {
    return this.commandBus.execute(new CreateRoleCommand(dto));
  }

  @Permission('role:manage', 'role:update')
  @Patch(':id')
  @SwaggerApiResponse(UpdateRolePermissionsResponseDto)
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsRequestDto,
  ): Promise<UpdateRolePermissionsResponseDto> {
    return this.commandBus.execute(new UpdateRolePermissionsCommand({ id, input: dto }));
  }

  @Permission('role:manage', 'role:delete')
  @Delete(':id')
  @SwaggerApiResponse(DeleteRoleResponseDto)
  async deleteRole(
    @Param('id') id: string,
  ): Promise<DeleteRoleResponseDto> {
    return this.commandBus.execute(new DeleteRoleCommand({ id }));
  }
}
