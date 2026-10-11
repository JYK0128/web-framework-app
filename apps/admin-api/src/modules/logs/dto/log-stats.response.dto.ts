import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base';

export class LogStatsResponseDto extends BaseDto {
  @ApiProperty() total!: number;
  @ApiProperty() errors!: number;
  @ApiProperty() averageDurationMs!: number;
  @ApiProperty() errorRate!: number;
}
