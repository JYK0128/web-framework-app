import { Query } from '@nestjs/cqrs';

import type { GetLogStatsRequestDto } from '#/modules/logs/dto/get-log-stats.request.dto';
import type { LogStatsResponseDto } from '#/modules/logs/dto/log-stats.response.dto';

export class GetLogStatsQuery extends Query<LogStatsResponseDto> {
  constructor(public readonly input: GetLogStatsRequestDto) { super(); }
}
