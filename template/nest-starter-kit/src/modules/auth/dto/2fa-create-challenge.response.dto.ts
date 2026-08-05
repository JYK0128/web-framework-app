import { ApiProperty } from '@nestjs/swagger';

import { EntityType } from '#/common/dto/entity-dto';
import { Verification } from '#/entities/auth/verification.entity';

export class Create2FAChallengeResponseDto extends EntityType(Verification) {
  @ApiProperty()
  token!: string;
}
