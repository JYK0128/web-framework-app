import { ApiProperty } from '@nestjs/swagger';

export class ActivityStatsResponseDto {
  @ApiProperty({ description: '총 수집 요청 수', example: 1250 })
  totalRequests!: number;

  @ApiProperty({ description: '오류 발생 건수 (상태코드 400 이상)', example: 12 })
  errorCount!: number;

  @ApiProperty({ description: '오류율 (%)', example: 0.9 })
  errorRate!: number;

  @ApiProperty({ description: '평균 응답 속도 (ms)', example: 18 })
  avgDuration!: number;

  @ApiProperty({ description: '최근 24시간 내 요청 건수', example: 850 })
  last24hCount!: number;
}
