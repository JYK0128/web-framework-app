import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsOptional, IsString } from 'class-validator';

export class OAuthLoginRequestDto extends BaseDto {
  @ApiPropertyOptional({ description: '로그인 완료 후 이동할 경로 또는 같은 출처의 URL' })
  @IsOptional()
  @IsString()
  callback?: string;
}
