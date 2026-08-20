import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LokiService } from '#/common/services/loki/loki.service';
import { type ActivityStatsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityStatsQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityStatsQuery)
export class GetActivityStatsHandler implements IQueryHandler<GetActivityStatsQuery, ActivityStatsResponseDto> {
  constructor(private readonly lokiService: LokiService) {}

  async execute(): Promise<ActivityStatsResponseDto> {
    return this.lokiService.getStats();
  }
}
