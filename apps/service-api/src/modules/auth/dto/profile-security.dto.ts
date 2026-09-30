import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class GenerateTwoFactorResponseDto {
  @ApiProperty({ type: String })
  secret!: string;

  @ApiProperty({ type: Number, description: '인증 앱에서 생성해야 하는 코드 길이' })
  digits!: number;

  @ApiProperty({ type: Number, description: '인증 앱에서 생성해야 하는 코드 유효 주기(초)' })
  periodSeconds!: number;
}

export class TwoFactorCodeRequestDto {
  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.twoFactor.digits, maxLength: SECURITY_CONFIG.twoFactor.digits })
  @IsString()
  @Length(SECURITY_CONFIG.twoFactor.digits, SECURITY_CONFIG.twoFactor.digits)
  code!: string;
}

export class TwoFactorStateResponseDto {
  @ApiProperty({ type: Boolean })
  enabled!: boolean;
}
