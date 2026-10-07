import { ApiProperty } from '@nestjs/swagger';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { Role } from '#/entities/auth.extensions/role.entity';

export class RoleItemDto extends EntityDto(Role) {
  @ApiProperty() override id!: string;
  @ApiProperty() override code!: string;
  @ApiProperty({ type: String, nullable: true }) override label!: string | null;
  @ApiProperty({ type: String, nullable: true }) override description!: string | null;
  @ApiProperty() override isSystem!: boolean;
  @ApiProperty({ type: [String] }) override permissions!: string[];
  @ApiProperty() userCount!: number;

  static override from(role: Role, userCount: number): RoleItemDto {
    return RoleItemDto.fromPlain({
      id: role.id,
      code: role.code,
      label: role.label,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions ?? [],
      userCount,
    });
  }
}
