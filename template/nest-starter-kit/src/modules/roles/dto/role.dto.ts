import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Role, RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

export class RoleDto extends DtoType(Role) {
  @ApiProperty({ example: 'role-123' })
  override id!: string;

  @ApiEnum({ enum: RoleName, example: RoleName.USER })
  override name!: RoleName;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  override permissions!: RolePermissions;
}
