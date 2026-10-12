import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class DeleteTermRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  termId!: string;
}
