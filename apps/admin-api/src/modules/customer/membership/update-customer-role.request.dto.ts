import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCustomerRoleRequestDto extends BaseDto {
  @ApiProperty({ example: 'super_user' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role!: string;
}
