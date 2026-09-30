import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class ChangePasswordRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength })
  @IsString()
  @Length(SECURITY_CONFIG.password.minLength, SECURITY_CONFIG.password.maxLength)
  newPassword!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength })
  @IsString()
  @Length(SECURITY_CONFIG.password.minLength, SECURITY_CONFIG.password.maxLength)
  confirmPassword!: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;
}

export class GenerateTwoFactorResponseDto {
  @ApiProperty({ type: String })
  secret!: string;

  @ApiProperty({ type: Number, description: '인증 앱에서 생성해야 하는 코드 길이' })
  digits!: number;

  @ApiProperty({ type: Number, description: '인증 앱에서 생성해야 하는 코드 유효 주기(초)' })
  periodSeconds!: number;
}

export class EnableTwoFactorRequestDto {
  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.twoFactor.digits, maxLength: SECURITY_CONFIG.twoFactor.digits })
  @IsString()
  @Length(SECURITY_CONFIG.twoFactor.digits, SECURITY_CONFIG.twoFactor.digits)
  code!: string;
}

export class EnableTwoFactorResponseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}

export class DisableTwoFactorResponseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}

export class UnregisterResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;
}

export class EmptyProfileSecurityRequestDto {}
