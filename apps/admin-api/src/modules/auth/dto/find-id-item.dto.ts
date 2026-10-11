import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class FindIdItemDto extends BaseDto {
  @ApiProperty() maskedEmail!: string;
  @ApiProperty() provider!: string;
}
