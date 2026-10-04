import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

export class AuthPolicyResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  registrationAvailable!: boolean;

  @ApiProperty({ type: Boolean })
  credentialRegistrationAvailable!: boolean;

  @ApiProperty({ type: Boolean })
  unregistrationAvailable!: boolean;

  @ApiProperty({ type: Boolean })
  emailVerificationRequired!: boolean;

  @ApiProperty({ type: Boolean })
  phoneNumberVerificationRequired!: boolean;

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
  twoFactorRequired!: boolean;

  @ApiProperty({ type: Number })
  twoFactorDigits!: number;
}
