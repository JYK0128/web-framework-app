import { ApiProperty } from '@nestjs/swagger';

import { EntityDto } from '#/common/dto/entity-dto';
import { Role, type RolePermissions } from '#/entities/auth.extensions/role.entity';

export class UpdateRolePermissionsResponseDto extends EntityDto(Role) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override key!: string;

  @ApiProperty({ type: 'string', nullable: true })
  override label!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  override description!: string | null;

  @ApiProperty({ type: 'boolean' })
  override isSystem!: boolean;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } })
  override permissions!: RolePermissions;
}
