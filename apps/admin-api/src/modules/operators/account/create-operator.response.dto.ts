import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { EntityResponseDto } from '@pkg/server-core/http/dto/response/entity.response.dto';

import { User } from '#/core/database/entities/auth';

@ApiSchema({ name: 'OperatorCreateResponse' })
export class CreateOperatorResponseDto extends EntityResponseDto(User) {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  emailVerificationRequired!: boolean;

  @ApiProperty()
  emailVerificationQueued!: boolean;

  static override parseEntity(operator: User, emailVerificationRequired: boolean, emailVerificationQueued: boolean): CreateOperatorResponseDto { return this.parse({ id: operator.id, emailVerificationRequired, emailVerificationQueued }); }
}
