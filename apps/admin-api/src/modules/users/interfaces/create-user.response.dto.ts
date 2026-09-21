import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

export class CreateUserResponseDto extends BaseDto {
  @ApiProperty()
  id!: string;
}
