import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TelemetryService } from '#/common/services/telemetry';
import { type GetActivityLogsResponseDto } from '#/modules/activity-logs/dto';
import { GetActivityLogsQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityLogsQuery)
export class GetActivityLogsHandler implements IQueryHandler<GetActivityLogsQuery, GetActivityLogsResponseDto> {
  constructor(private readonly telemetryService: TelemetryService) {}

  async execute(query: GetActivityLogsQuery): Promise<GetActivityLogsResponseDto> {
    return this.telemetryService.getLogs(query.query);
  }
}
