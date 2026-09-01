import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Role, RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

export class RoleDto extends DtoType(Role) {
  constructor(role: Role) {
    super();
    this.id = role.id;
    this.name = role.name;
    this.permissions = role.permissions;
  }

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiEnum({ enum: RoleName })
  override name!: RoleName;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  override permissions!: RolePermissions;
}
