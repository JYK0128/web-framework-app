import { Query } from '@nestjs/cqrs';

import type { GetLogStatsRequestDto, LogStatsResponseDto } from '#/modules/log-management/dto';

export class GetLogStatsQuery extends Query<LogStatsResponseDto> {
  constructor(public readonly query?: GetLogStatsRequestDto) {
    super();
  }
}
