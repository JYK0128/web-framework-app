import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '../base/base.dto';

export class OkResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;
}
