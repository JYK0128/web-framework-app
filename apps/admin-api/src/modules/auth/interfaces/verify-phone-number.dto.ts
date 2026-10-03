import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyPhoneNumberRequestDto {
  @ApiProperty({ type: String, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  identityVerificationId!: string;
}

export class VerifyPhoneNumberResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  phoneNumberVerified!: boolean;
}
