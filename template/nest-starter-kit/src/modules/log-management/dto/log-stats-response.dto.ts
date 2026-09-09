import { ApiProperty } from '@nestjs/swagger';

export class LogStatsResponseDto {
  constructor(init?: Partial<LogStatsResponseDto>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  @ApiProperty({ type: 'number' })
  totalRequests!: number;

  @ApiProperty({ type: 'number' })
  errorCount!: number;

  @ApiProperty({ type: 'number' })
  errorRate!: number;

  @ApiProperty({ type: 'number' })
  avgDuration!: number;
}
