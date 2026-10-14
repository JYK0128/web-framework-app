import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetCustomerSessionsRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;
}
