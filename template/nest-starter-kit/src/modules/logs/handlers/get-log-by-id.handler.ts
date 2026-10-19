import { HttpStatus } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type GetLogByIdResponseDto } from '#/modules/logs/dto';
import { GetLogByIdQuery } from '#/modules/logs/queries';

@QueryHandler(GetLogByIdQuery)
export class GetLogByIdHandler implements IQueryHandler<GetLogByIdQuery, GetLogByIdResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogByIdQuery): Promise<GetLogByIdResponseDto> {
    const log = await this.identify(query);
    this.verify(log);
    return this.process(log);
  }

  private identify(query: GetLogByIdQuery): Promise<GetLogByIdResponseDto | null> {
    return this.logTelemetryService.getLogById(query.input.logId);
  }

  private verify(log: GetLogByIdResponseDto | null): asserts log is GetLogByIdResponseDto {
    if (!log) {
      throw new ApplicationError({ code: 'LOG_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }

  private process(log: GetLogByIdResponseDto): GetLogByIdResponseDto {
    return log;
  }
}
