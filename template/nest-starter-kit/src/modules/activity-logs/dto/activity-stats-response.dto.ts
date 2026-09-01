import { ApiProperty } from '@nestjs/swagger';

export class ActivityStatsResponseDto {
  constructor(init?: Partial<ActivityStatsResponseDto>) {
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

  @ApiProperty({ type: 'number' })
  last24hCount!: number;
}
