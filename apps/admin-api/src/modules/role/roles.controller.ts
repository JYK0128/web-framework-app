import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { CreateRoleCommand } from '~/modules/role/create-role.command';
import { CreateRoleRequestDto } from '~/modules/role/create-role.request.dto';
import { CreateRoleResponseDto } from '~/modules/role/create-role.response.dto';
import { DeleteRoleCommand } from '~/modules/role/delete-role.command';
import { DeleteRoleRequestDto } from '~/modules/role/delete-role.request.dto';
import { DeleteRoleResponseDto } from '~/modules/role/delete-role.response.dto';
import { GetRolesQuery } from '~/modules/role/get-roles.query';
import { GetRolesRequestDto } from '~/modules/role/get-roles.request.dto';
import { GetRolesResponseDto } from '~/modules/role/get-roles.response.dto';
import { UpdateRoleCommand } from '~/modules/role/update-role.command';
import { UpdateRoleRequestDto } from '~/modules/role/update-role.request.dto';
import { UpdateRoleResponseDto } from '~/modules/role/update-role.response.dto';

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
