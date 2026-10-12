import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class TwoFactorLoginRequestDto {
  @ApiProperty({ type: String, description: '비밀번호 확인 후 발급된 일회성 로그인 챌린지 토큰' })
  @IsString()
  @IsNotEmpty()
  twoFactorChallengeToken!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.twoFactor.digits, maxLength: SECURITY_CONFIG.twoFactor.digits })
  @IsString()
  @Length(SECURITY_CONFIG.twoFactor.digits, SECURITY_CONFIG.twoFactor.digits)
  code!: string;
}
