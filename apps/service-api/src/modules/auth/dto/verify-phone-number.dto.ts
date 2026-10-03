import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPhoneNumberRequestDto {
  @ApiProperty({ type: String, description: 'PortOne verification transaction ID' })
  @IsString()
  @IsNotEmpty()
  identityVerificationId!: string;
}

export class VerifyPhoneNumberResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  phoneNumberVerified!: boolean;
}
