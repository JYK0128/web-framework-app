import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, Controller, Get, HttpStatus, Inject, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';

import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { Role } from '#/entities/auth.extentions/role.entity';

import { GetRolesResponseDto, UpdateRolePermissionsRequestDto, UpdateRolePermissionsResponseDto } from './dto';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: EntityRepository<Role>,
    @Inject(EntityManager)
    private readonly em: EntityManager,
  ) {}

  @Public()
  @Permission('role:read')
  @Get()
  @SwaggerApiResponse(GetRolesResponseDto)
  async getRoles(): Promise<GetRolesResponseDto> {
    const roles = await this.roleRepository.findAll();
    return { items: roles, roles };
  }

  @Public()
  @Permission('role:update')
  @Put(':id')
  @SwaggerApiResponse(UpdateRolePermissionsResponseDto)
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsRequestDto,
  ): Promise<UpdateRolePermissionsResponseDto> {
    const role = await this.roleRepository.findOne({ id });
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
