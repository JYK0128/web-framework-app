import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type GetLogsResponseDto } from '#/modules/log-management/dto';
import { GetLogsQuery } from '#/modules/log-management/queries';

@QueryHandler(GetLogsQuery)
export class GetLogsHandler implements IQueryHandler<GetLogsQuery, GetLogsResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogsQuery): Promise<GetLogsResponseDto> {
    return this.logTelemetryService.getLogs(query.query);
  }
}
