import { HttpStatus } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type ActivityLogItemDto } from '#/modules/activity-logs/dto';
import { GetActivityLogByIdQuery } from '#/modules/activity-logs/queries';

@QueryHandler(GetActivityLogByIdQuery)
export class GetActivityLogByIdHandler implements IQueryHandler<GetActivityLogByIdQuery, ActivityLogItemDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetActivityLogByIdQuery): Promise<ActivityLogItemDto> {
    const log = await this.logTelemetryService.getLogById(query.input.id);
    if (!log) {
      throw new ApplicationError({ code: 'ACTIVITY_LOG_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return log;
  }
}
