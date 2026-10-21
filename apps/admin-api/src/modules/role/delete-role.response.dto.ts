import { ApiProperty } from '@nestjs/swagger';
import { EntityResponseDto } from '@pkg/server-core/http/dto/response';

import { Role } from '~/core/database/entities/auth.extensions';

export class DeleteRoleResponseDto extends EntityResponseDto(Role) {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;

  static override parseEntity(role: Role): DeleteRoleResponseDto { return this.parse({ id: role.id, deleted: true }); }
}
