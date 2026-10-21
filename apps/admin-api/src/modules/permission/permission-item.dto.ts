import { ApiProperty } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';

import { Permission as PermissionEntity } from '~/core/database/entities/auth.extensions';

export class PermissionItemDto extends EntityDto(PermissionEntity) {
  @ApiProperty() override id!: string;
  @ApiProperty() override code!: string;
  @ApiProperty() resource!: string;
  @ApiProperty() action!: string;
  @ApiProperty() override label!: string;
  @ApiProperty({ nullable: true }) override description!: string | null;

  static override parseEntity(permission: PermissionEntity): PermissionItemDto {
    const separatorIndex = permission.code.indexOf(':');
    return this.parse({
      id: permission.id,
      code: permission.code,
      resource: separatorIndex > 0 ? permission.code.slice(0, separatorIndex) : permission.code,
      action: separatorIndex > 0 ? permission.code.slice(separatorIndex + 1) : '',
      label: permission.label,
      description: permission.description,
    });
  }
}
