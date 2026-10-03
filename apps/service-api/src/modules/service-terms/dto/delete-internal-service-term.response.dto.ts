import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

export class DeleteInternalServiceTermResponseDto extends BaseDto {
  @ApiProperty() success!: boolean;
}
