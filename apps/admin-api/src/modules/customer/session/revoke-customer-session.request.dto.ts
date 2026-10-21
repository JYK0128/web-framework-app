import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeCustomerSessionRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  familyId!: string;
}
