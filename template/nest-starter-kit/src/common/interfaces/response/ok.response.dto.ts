import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

export class OkResponseDto extends BaseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
