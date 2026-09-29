import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'LoginResponse' })
export class LoginResponseDto extends BaseDto {
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
