import { Query } from '@nestjs/cqrs';

import type { GetLogStatsRequestDto } from '~/modules/log/get-log-stats.request.dto';
import type { GetLogStatsResponseDto } from '~/modules/log/get-log-stats.response.dto';

export class GetLogStatsQuery extends Query<GetLogStatsResponseDto> {
  constructor(public readonly input: GetLogStatsRequestDto) { super(); }
}
