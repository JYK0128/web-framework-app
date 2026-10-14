import { ApiHideProperty, ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

@ApiSchema({ name: 'TwoFactorLoginResponse' })
export class TwoFactorLoginResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  requiresTwoFactor!: false;

  @ApiPropertyOptional({ type: String, description: '초단기 액세스 토큰 (JWT)' })
  accessToken?: string;

  @ApiPropertyOptional({ type: String, description: '네이티브 클라이언트용 Refresh Token' })
  refreshToken?: string;

  @ApiHideProperty()
  refreshTokenTtlSeconds?: number;
}
