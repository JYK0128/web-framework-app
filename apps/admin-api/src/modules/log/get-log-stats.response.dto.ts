import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';

export class GetLogStatsResponseDto extends BaseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  errors!: number;

  @ApiProperty()
  averageDurationMs!: number;

  @ApiProperty()
  errorRate!: number;
}
