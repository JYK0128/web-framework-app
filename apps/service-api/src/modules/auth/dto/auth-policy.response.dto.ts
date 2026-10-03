import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

export class AuthPolicyResponseDto extends BaseDto {
  @ApiProperty({ type: Number })
  passwordMinLength!: number;

  @ApiProperty({ type: Number })
  passwordMaxLength!: number;

  @ApiProperty({ type: Number })
  passwordMaxBytes!: number;

  @ApiProperty({ type: Boolean })
  passwordRequiresNumbers!: boolean;

  @ApiProperty({ type: Boolean })
  passwordRequiresSpecialChar!: boolean;

  @ApiProperty({ type: Boolean })
  passwordRequiresUppercase!: boolean;

  @ApiProperty({ type: Boolean })
  registrationAvailable!: boolean;

  @ApiProperty({ type: Boolean })
  credentialRegistrationAvailable!: boolean;

  @ApiProperty({ type: Boolean })
  unregistrationAvailable!: boolean;

  @ApiProperty({ type: Boolean, description: '전화번호 인증을 서비스 이용에 필수로 요구하는지 여부' })
  phoneNumberVerificationRequired!: boolean;

  @ApiProperty({ type: Boolean, description: '2단계 인증을 필수로 요구하는지 여부' })
  twoFactorRequired!: boolean;

  @ApiProperty({ type: Number })
  twoFactorDigits!: number;
}
