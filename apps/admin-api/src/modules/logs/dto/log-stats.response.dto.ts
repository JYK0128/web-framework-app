import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base';

export class LogStatsResponseDto extends BaseDto {
  @ApiProperty() total!: number;
  @ApiProperty() errors!: number;
  @ApiProperty() averageDurationMs!: number;
  @ApiProperty() errorRate!: number;
}
