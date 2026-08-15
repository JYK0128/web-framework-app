import { Body, Controller, Get, HttpStatus, Inject, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

import { Permission } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AppEntityManager } from '#/database/entity-manager';
import { Role } from '#/entities/auth.extentions/role.entity';

import { GetRolesResponseDto, UpdateRolePermissionsRequestDto, UpdateRolePermissionsResponseDto } from './dto';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    @Inject(AppEntityManager)
    private readonly em: AppEntityManager,
  ) {}

  @Permission('role:read')
  @Get()
  @SwaggerApiResponse(GetRolesResponseDto)
  async getRoles(): Promise<GetRolesResponseDto> {
    const roles = await this.em.find(Role, {});
    return { items: roles, roles };
  }

  @Permission('role:update')
  @Put(':id')
  @SwaggerApiResponse(UpdateRolePermissionsResponseDto)
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsRequestDto,
  ): Promise<UpdateRolePermissionsResponseDto> {
    const role = await this.em.findOne(Role, { id });
    if (!role) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    role.permissions = dto.permissions;
    await this.em.flush();
    return {
      id: role.id,
      name: role.name,
      permissions: role.permissions,
    };
  }
}
