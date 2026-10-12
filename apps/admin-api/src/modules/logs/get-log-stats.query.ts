import { Query } from '@nestjs/cqrs';

import type { GetLogStatsRequestDto } from '#/modules/logs/get-log-stats.request.dto';
import type { LogStatsResponseDto } from '#/modules/logs/log-stats.response.dto';

export class GetLogStatsQuery extends Query<LogStatsResponseDto> {
  constructor(public readonly input: GetLogStatsRequestDto) { super(); }
}
