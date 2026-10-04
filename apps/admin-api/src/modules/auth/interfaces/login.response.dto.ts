import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';

@ApiSchema({ name: 'LoginResponse' })
export class LoginResponseDto extends BaseDto {
  @ApiPropertyOptional({ type: Boolean, description: '2단계 인증 코드 입력이 필요한 로그인 단계인지 여부' })
  requiresTwoFactor?: boolean;

  @ApiPropertyOptional({ type: String, description: 'OTP 검증을 위한 일회성 로그인 챌린지 토큰' })
  twoFactorChallengeToken?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '초단기 액세스 토큰 (JWT)',
  })
  accessToken?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'rt_01J23456789ABCDEF',
    description: '순수 네이티브 앱용 Refresh Token (웹 브라우저는 HttpOnly 쿠키로 전달)',
  })
  refreshToken?: string;
}
