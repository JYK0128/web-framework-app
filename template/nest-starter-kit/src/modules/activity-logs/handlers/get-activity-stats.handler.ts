import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type ActivityStatsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityStatsQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityStatsQuery)
export class GetActivityStatsHandler implements IQueryHandler<GetActivityStatsQuery, ActivityStatsResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(): Promise<ActivityStatsResponseDto> {
    return this.logTelemetryService.getStats();
  }
}
