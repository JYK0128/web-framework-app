import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';

export class UpdateRolePermissionsRequestDto extends DtoType(Role) {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  @IsObject()
  override permissions!: RolePermissions;
}
