import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { CreateRoleCommand } from '#/modules/roles/create-role.command';
import { CreateRoleRequestDto } from '#/modules/roles/create-role.request.dto';
import { CreateRoleResponseDto } from '#/modules/roles/create-role.response.dto';
import { DeleteRoleCommand } from '#/modules/roles/delete-role.command';
import { DeleteRoleRequestDto } from '#/modules/roles/delete-role.request.dto';
import { DeleteRoleResponseDto } from '#/modules/roles/delete-role.response.dto';
import { GetRolesQuery } from '#/modules/roles/get-roles.query';
import { GetRolesRequestDto } from '#/modules/roles/get-roles.request.dto';
import { GetRolesResponseDto } from '#/modules/roles/get-roles.response.dto';
import { UpdateRoleCommand } from '#/modules/roles/update-role.command';
import { UpdateRoleRequestDto } from '#/modules/roles/update-role.request.dto';
import { UpdateRoleResponseDto } from '#/modules/roles/update-role.response.dto';

@ApiTags('roles')
@UserAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(AdminPermission.role.read)
  @SwaggerApiResponse(GetRolesResponseDto)
  @ApiOperation({ summary: '역할 목록 조회' })
  getRoles(): Promise<GetRolesResponseDto> {
    return this.queryBus.execute(new GetRolesQuery(new GetRolesRequestDto()));
  }

  @Post()
  @Permissions(AdminPermission.role.create)
  @SwaggerApiResponse(CreateRoleResponseDto)
  @ApiOperation({ summary: '역할 생성' })
  createRole(@Body() input: CreateRoleRequestDto): Promise<CreateRoleResponseDto> {
    return this.commandBus.execute(new CreateRoleCommand(input));
  }

  @Patch(':id')
  @Permissions(AdminPermission.role.update)
  @SwaggerApiResponse(UpdateRoleResponseDto)
  @ApiOperation({ summary: '역할 수정' })
  updateRole(@Param('id') id: string, @Body() input: UpdateRoleRequestDto): Promise<UpdateRoleResponseDto> {
    return this.commandBus.execute(new UpdateRoleCommand({ roleId: id, input }));
  }

  @Delete(':id')
  @Permissions(AdminPermission.role.delete)
  @SwaggerApiResponse(DeleteRoleResponseDto)
  @ApiOperation({ summary: '역할 삭제' })
  deleteRole(@Param('id') id: string): Promise<DeleteRoleResponseDto> {
    const request = DeleteRoleRequestDto.parse({ roleId: id }).validate();
    return this.commandBus.execute(new DeleteRoleCommand(request));
  }
}
