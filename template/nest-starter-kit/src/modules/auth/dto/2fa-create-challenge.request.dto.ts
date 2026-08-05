import { ApiProperty } from '@nestjs/swagger';

import { EntityType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class Create2FAChallengeRequestDto extends EntityType(User) {
  @ApiProperty({ format: 'uuid' })
  userId!: string;
}
