import { ApiProperty } from '@nestjs/swagger';

import { OkResponseDto } from '#/common/interfaces/response';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyPhoneNumberRequestDto {
  @ApiProperty({ type: String, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  identityVerificationId!: string;
}

export class VerifyPhoneNumberResponseDto extends OkResponseDto {}
