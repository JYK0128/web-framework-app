import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateRoleCommand, DeleteRoleCommand, UpdateRoleCommand } from './commands';
import { CreateRoleRequestDto, CreateRoleResponseDto, DeleteRoleResponseDto, GetRolesResponseDto, UpdateRoleRequestDto, UpdateRoleResponseDto } from './interfaces';
import { GetRolesQuery } from './queries';

@ApiTags('roles')
@UserAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(Permission.role.read)
  @SwaggerApiResponse(GetRolesResponseDto)
  @ApiOperation({ summary: '역할 목록 조회' })
  getRoles(): Promise<GetRolesResponseDto> {
    return this.queryBus.execute(new GetRolesQuery());
  }

  @Post()
  @Permissions(Permission.role.create)
  @SwaggerApiResponse(CreateRoleResponseDto)
  @ApiOperation({ summary: '역할 생성' })
  createRole(@Body() input: CreateRoleRequestDto): Promise<CreateRoleResponseDto> {
    return this.commandBus.execute(new CreateRoleCommand(input));
  }

  @Patch(':id')
  @Permissions(Permission.role.update)
  @SwaggerApiResponse(UpdateRoleResponseDto)
  @ApiOperation({ summary: '역할 수정' })
  updateRole(@Param('id') id: string, @Body() input: UpdateRoleRequestDto): Promise<UpdateRoleResponseDto> {
    return this.commandBus.execute(new UpdateRoleCommand({ roleId: id, input }));
  }

  @Delete(':id')
  @Permissions(Permission.role.delete)
  @SwaggerApiResponse(DeleteRoleResponseDto)
  @ApiOperation({ summary: '역할 삭제' })
  deleteRole(@Param('id') id: string): Promise<DeleteRoleResponseDto> {
    return this.commandBus.execute(new DeleteRoleCommand({ roleId: id }));
  }
}
