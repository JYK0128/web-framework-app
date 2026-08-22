import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TelemetryService } from '#/infra/telemetry';
import { type ActivityStatsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityStatsQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityStatsQuery)
export class GetActivityStatsHandler implements IQueryHandler<GetActivityStatsQuery, ActivityStatsResponseDto> {
  constructor(private readonly telemetryService: TelemetryService) {}

  async execute(): Promise<ActivityStatsResponseDto> {
    return this.telemetryService.getStats();
  }
}
