import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class DeleteTermGroupRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  groupId!: string;
}
