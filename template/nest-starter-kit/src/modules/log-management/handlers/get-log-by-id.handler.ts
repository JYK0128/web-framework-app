import { HttpStatus } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type LogItemDto } from '#/modules/log-management/dto';
import { GetLogByIdQuery } from '#/modules/log-management/queries';

@QueryHandler(GetLogByIdQuery)
export class GetLogByIdHandler implements IQueryHandler<GetLogByIdQuery, LogItemDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogByIdQuery): Promise<LogItemDto> {
    const log = await this.logTelemetryService.getLogById(query.input.id);
    if (!log) {
      throw new ApplicationError({ code: 'LOG_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return log;
  }
}
