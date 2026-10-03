import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

export class OkResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean, example: true })
  ok!: boolean;
}
