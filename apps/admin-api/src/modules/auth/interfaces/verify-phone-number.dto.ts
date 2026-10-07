import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { OkResponseDto } from '#/common/interfaces/response';

export class VerifyPhoneNumberRequestDto {
  @ApiProperty({ type: String, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  identityVerificationId!: string;
}

export class VerifyPhoneNumberResponseDto extends OkResponseDto {}
