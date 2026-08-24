import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type GetActivityLogsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityLogsQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityLogsQuery)
export class GetActivityLogsHandler implements IQueryHandler<GetActivityLogsQuery, GetActivityLogsResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetActivityLogsQuery): Promise<GetActivityLogsResponseDto> {
    return this.logTelemetryService.getLogs(query.query);
  }
}
