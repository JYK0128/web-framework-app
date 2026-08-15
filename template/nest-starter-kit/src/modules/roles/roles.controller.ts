import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { UpdateRolePermissionsCommand } from './commands';
import { GetRolesResponseDto, UpdateRolePermissionsRequestDto, UpdateRolePermissionsResponseDto } from './dto';
import { GetRolesQuery } from './queries';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permission('role:read')
  @Get()
  @SwaggerApiResponse(GetRolesResponseDto)
  async getRoles(): Promise<GetRolesResponseDto> {
    return this.queryBus.execute(new GetRolesQuery());
  }

  @Permission('role:update')
  @Put(':id')
  @SwaggerApiResponse(UpdateRolePermissionsResponseDto)
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsRequestDto,
  ): Promise<UpdateRolePermissionsResponseDto> {
    return this.commandBus.execute(new UpdateRolePermissionsCommand(id, dto));
  }
}
