import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';

import { Permission } from '~/core/database/entities/auth.extensions';

@ApiSchema({ name: 'CustomerMembershipPermissionItem' })
export class CustomerMembershipPermissionItemDto extends EntityDto(Permission) {
  @ApiProperty() code!: string;
  @ApiProperty() resource!: string;
  @ApiProperty() action!: string;
  @ApiProperty() label!: string;
  @ApiPropertyOptional() description?: string;

  static override parseEntity(permission: Permission): CustomerMembershipPermissionItemDto {
    const { code, label, description } = permission;
    const separatorIndex = code.indexOf(':');
    return this.parse({ code, resource: separatorIndex > 0 ? code.slice(0, separatorIndex) : code, action: separatorIndex > 0 ? code.slice(separatorIndex + 1) : '', label, description });
  }
}
