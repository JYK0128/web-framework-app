import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type GetLogsResponseDto } from '#/modules/logs/dto';
import { GetLogsQuery } from '#/modules/logs/queries';

@QueryHandler(GetLogsQuery)
export class GetLogsHandler implements IQueryHandler<GetLogsQuery, GetLogsResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogsQuery): Promise<GetLogsResponseDto> {
    const input = this.identify(query);
    this.verify(input);
    return this.process(input);
  }

  private identify(query: GetLogsQuery): GetLogsQuery['input']['query'] {
    return query.input.query;
  }

  private verify(query: GetLogsQuery['input']['query']): void {
    if (query.limit !== undefined && (query.limit < 1 || query.limit > 100)) {
      throw new Error('로그 조회 건수는 1에서 100 사이여야 합니다.');
    }
    if (query.startDate && query.endDate && new Date(query.startDate) > new Date(query.endDate)) {
      throw new Error('로그 조회 시작일은 종료일보다 늦을 수 없습니다.');
    }
  }

  private process(query: GetLogsQuery['input']['query']): Promise<GetLogsResponseDto> {
    return this.logTelemetryService.getLogs(query);
  }
}
