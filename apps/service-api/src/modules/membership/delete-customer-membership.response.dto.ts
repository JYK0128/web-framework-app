import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { EntityResponseDto } from '@pkg/server-core/http/dto/response/entity.response.dto';

import { Role } from '#/core/database/entities/auth.extensions';

@ApiSchema({ name: 'DeleteCustomerMembershipResponse' })
export class DeleteCustomerMembershipResponseDto extends EntityResponseDto(Role) {
  @ApiProperty() id!: string;
  @ApiProperty() deleted!: boolean;

  static override parseEntity(role: Role): DeleteCustomerMembershipResponseDto { return this.parse({ id: role.id, deleted: true }); }
}
