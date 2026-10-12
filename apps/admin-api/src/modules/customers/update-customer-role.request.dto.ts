import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class UpdateCustomerRoleRequestDto extends BaseDto {
  @ApiProperty({ example: 'super_user' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role!: string;
}
