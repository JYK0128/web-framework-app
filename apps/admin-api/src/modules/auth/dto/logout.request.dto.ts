import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'LogoutRequest' })
export class LogoutRequestDto extends BaseDto {
  @ApiPropertyOptional({
    type: 'string',
    example: 'sess_123456789',
    description: '모바일/외부 클라이언트용 Refresh Token (웹 브라우저는 쿠키 또는 Session Context 사용 시 생략 가능)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
