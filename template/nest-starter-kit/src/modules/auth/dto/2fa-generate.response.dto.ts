import { ApiProperty } from '@nestjs/swagger';

import { EntityType } from '#/common/dto/entity-dto';
import { TwoFactor } from '#/entities/auth/two-factor.entity';

export class Generate2FAResponseDto extends EntityType(TwoFactor) {
  @ApiProperty()
  qrCodeUrl!: string;
}
