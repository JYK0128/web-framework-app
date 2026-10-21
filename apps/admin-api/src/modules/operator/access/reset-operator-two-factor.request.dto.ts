import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetOperatorTwoFactorRequestDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  operatorId!: string;
}
