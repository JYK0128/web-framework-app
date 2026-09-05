import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type LogStatsResponseDto } from '#/modules/log-management/dto';
import { GetLogStatsQuery } from '#/modules/log-management/queries';

@QueryHandler(GetLogStatsQuery)
export class GetLogStatsHandler implements IQueryHandler<GetLogStatsQuery, LogStatsResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogStatsQuery): Promise<LogStatsResponseDto> {
    return this.logTelemetryService.getStats(query.query);
  }
}
