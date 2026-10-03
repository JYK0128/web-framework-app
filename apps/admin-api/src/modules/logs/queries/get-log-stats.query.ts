import { Query } from '@nestjs/cqrs';

import type { GetLogStatsRequestDto } from '../dto/get-log-stats.request.dto';
import type { LogStatsResponseDto } from '../dto/log-stats.response.dto';

export class GetLogStatsQuery extends Query<LogStatsResponseDto> {
  constructor(public readonly input: GetLogStatsRequestDto) { super(); }
}
