import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class CheckLiveResponseDto extends BaseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error', 'shutting_down'], description: '종합 상태' })
  status!: string;

  @ApiPropertyOptional({
    type: Object,
    example: { database: { status: 'up' }, redis: { status: 'up' } },
    description: '정상 가동 하위 서비스 목록',
  })
  info?: Record<string, { status: string }>;

  @ApiPropertyOptional({
    type: Object,
    example: {},
    description: '오류 발생 하위 서비스 목록',
  })
  error?: Record<string, { status: string }>;

  @ApiPropertyOptional({
    type: Object,
    example: { database: { status: 'up' }, redis: { status: 'up' } },
    description: '세부 진단 정보',
  })
  details?: Record<string, { status: string }>;
}
