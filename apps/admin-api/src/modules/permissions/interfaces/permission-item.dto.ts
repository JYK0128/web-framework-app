import { ApiProperty } from '@nestjs/swagger';

import { EntityResponseDto } from '#/common/interfaces/base';
import { Permission as PermissionEntity } from '#/entities/auth.extensions/permission.entity';

export class PermissionItemDto extends EntityResponseDto(PermissionEntity) {
  @ApiProperty() override id!: string;
  @ApiProperty() override code!: string;
  @ApiProperty() resource!: string;
  @ApiProperty() action!: string;
  @ApiProperty() override label!: string;
  @ApiProperty({ nullable: true }) override description!: string | null;

  static override from(permission: PermissionEntity): PermissionItemDto {
    const separatorIndex = permission.code.indexOf(':');
    return PermissionItemDto.fromPlain({
      id: permission.id,
      code: permission.code,
      resource: separatorIndex > 0 ? permission.code.slice(0, separatorIndex) : permission.code,
      action: separatorIndex > 0 ? permission.code.slice(separatorIndex + 1) : '',
      label: permission.label,
      description: permission.description,
    });
  }
}
