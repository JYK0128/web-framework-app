import { ApiProperty } from '@nestjs/swagger';

import { EntityResponseDto } from '#/common/interfaces/base';
import { Role } from '#/entities/auth.extensions/role.entity';

export class RoleItemDto extends EntityResponseDto(Role) {
  @ApiProperty() override id!: string;
  @ApiProperty() override code!: string;
  @ApiProperty({ nullable: true }) override label!: string | null;
  @ApiProperty({ nullable: true }) override description!: string | null;
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
