import { HttpStatus } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type GetLogResponseDto } from '#/modules/log-management/dto';
import { GetLogByIdQuery } from '#/modules/log-management/queries';

@QueryHandler(GetLogByIdQuery)
export class GetLogByIdHandler implements IQueryHandler<GetLogByIdQuery, GetLogResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogByIdQuery): Promise<GetLogResponseDto> {
    const log = await this.identify(query);
    this.verify(log);
    return this.process(log);
  }

  private identify(query: GetLogByIdQuery): Promise<GetLogResponseDto | null> {
    return this.logTelemetryService.getLogById(query.input.id);
  }

  private verify(log: GetLogResponseDto | null): asserts log is GetLogResponseDto {
    if (!log) {
      throw new ApplicationError({ code: 'LOG_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }

  private process(log: GetLogResponseDto): GetLogResponseDto {
    return log;
  }
}
