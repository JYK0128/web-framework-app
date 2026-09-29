import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'LogStatsResponseDto' })
export class GetLogStatsResponseDto extends BaseDto {
  @ApiProperty({ type: 'number' })
  totalRequests!: number;

  @ApiProperty({ type: 'number' })
  errorCount!: number;

  @ApiProperty({ type: 'number' })
  errorRate!: number;

  @ApiProperty({ type: 'number' })
  avgDuration!: number;
}
