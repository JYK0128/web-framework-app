import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCustomerRoleRequestDto {
  @ApiProperty({ example: 'super_user' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role!: string;
}
