import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

export class LogStatsResponseDto extends BaseDto {
  @ApiProperty({ type: 'number' })
  totalRequests!: number;

  @ApiProperty({ type: 'number' })
  errorCount!: number;

  @ApiProperty({ type: 'number' })
  errorRate!: number;

  @ApiProperty({ type: 'number' })
  avgDuration!: number;
}
