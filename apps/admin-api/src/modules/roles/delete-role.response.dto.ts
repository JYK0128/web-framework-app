import { ApiProperty } from '@nestjs/swagger';

import { Role } from '#/core/database/entities/auth.extensions';
import { EntityResponseDto } from '#/core/http/dto/response/entity.response.dto';

export class DeleteRoleResponseDto extends EntityResponseDto(Role) {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;

  static override parseEntity(role: Role): DeleteRoleResponseDto { return this.parse({ id: role.id, deleted: true }); }
}
