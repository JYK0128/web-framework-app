import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Role, type RolePermissions } from '#/entities/auth.extentions/role.entity';

export class RoleDto extends DtoType(Role) {
  constructor(role: Role, userCount = 0) {
    super();
    this.id = role.id;
    this.name = role.name;
    this.label = role.label ?? null;
    this.description = role.description ?? null;
    this.isSystem = Boolean(role.isSystem);
    this.permissions = role.permissions;
    this.userCount = userCount;
  }

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override name!: string;

  @ApiProperty({ type: 'string', nullable: true })
  override label!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  override description!: string | null;

  @ApiProperty({ type: 'boolean' })
  override isSystem!: boolean;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  override permissions!: RolePermissions;

  @ApiProperty({ type: 'number' })
  userCount!: number;
}
