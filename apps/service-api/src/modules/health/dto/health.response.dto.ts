import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'HealthIndicatorStatus' })
export class HealthIndicatorStatusDto {
  @ApiProperty({ type: String, example: 'up', description: '인디케이터 상태' })
  status!: string;
}

@ApiSchema({ name: 'HealthResponse' })
export class HealthResponseDto extends BaseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error', 'shutting_down'], description: '종합 상태' })
  status!: string;

  @ApiPropertyOptional({
    type: Object,
    example: { database: { status: 'up' }, redis: { status: 'up' } },
    description: '정상 가동 하위 서비스 목록',
  })
  info?: Record<string, HealthIndicatorStatusDto>;

  @ApiPropertyOptional({
    type: Object,
    example: {},
    description: '오류 발생 하위 서비스 목록',
  })
  error?: Record<string, HealthIndicatorStatusDto>;

  @ApiPropertyOptional({
    type: Object,
    example: { database: { status: 'up' }, redis: { status: 'up' } },
    description: '세부 진단 정보',
  })
  details?: Record<string, HealthIndicatorStatusDto>;
}
