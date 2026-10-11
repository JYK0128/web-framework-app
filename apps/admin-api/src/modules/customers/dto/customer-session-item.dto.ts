import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class CustomerSessionItemDto extends BaseDto {
  @ApiProperty()
  familyId!: string;

  @ApiProperty()
  rememberMe!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}
