import { ApiProperty } from '@nestjs/swagger';

export class AuthPolicyResponseDto {
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
  twoFactorAvailable!: boolean;

  @ApiProperty({ type: Number })
  twoFactorCodeLength!: number;
}
