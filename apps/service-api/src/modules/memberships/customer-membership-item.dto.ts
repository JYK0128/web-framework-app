import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base/entity.dto';

import { Role } from '#/core/database/entities/auth.extensions';

@ApiSchema({ name: 'CustomerMembershipItem' })
export class CustomerMembershipItemDto extends EntityDto(Role) {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty({ type: String, nullable: true }) label!: string | null;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty() isSystem!: boolean;
  @ApiProperty() customerCount!: number;
  @ApiProperty({ type: [String] }) permissions!: string[];

  static override parseEntity(role: Role, customerCount: number): CustomerMembershipItemDto {
    return this.parse({ id: role.id, code: role.code, label: role.label, description: role.description, isSystem: role.isSystem, customerCount, permissions: role.permissions ?? [] });
  }
}
