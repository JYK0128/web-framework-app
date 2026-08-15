import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Role, ROLE_NAMES, type RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

export class RoleDto extends DtoType(Role) {
  @ApiProperty({ example: 'role-123' })
  override id!: string;

  @ApiProperty({ enum: ROLE_NAMES, example: ROLE_NAMES.USER })
  override name!: RoleName;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  override permissions!: RolePermissions;
}
