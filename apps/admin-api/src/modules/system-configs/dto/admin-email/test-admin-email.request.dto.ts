import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class TestAdminEmailRequestDto extends BaseDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;
}
