import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'LoginCredentialResponse' })
export class LoginCredentialResponseDto extends BaseDto {
  @ApiProperty({
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '초단기 액세스 토큰 (JWT)',
  })
  accessToken!: string;

  @ApiProperty({
    type: Number,
    example: 180,
    description: '액세스 토큰 만료 시간 (초)',
  })
  expiresIn!: number;

  @ApiPropertyOptional({
    type: String,
    example: 'rt_01J23456789ABCDEF',
    description: '순수 네이티브 앱용 Refresh Token (웹 브라우저는 HttpOnly 쿠키로 전달)',
  })
  refreshToken?: string;
}
