import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyPhoneNumberRequestDto extends BaseDto {
  @ApiProperty({ type: String, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  identityVerificationId!: string;
}
