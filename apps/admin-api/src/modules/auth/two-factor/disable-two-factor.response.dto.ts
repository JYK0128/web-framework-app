import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class DisableTwoFactorResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}
