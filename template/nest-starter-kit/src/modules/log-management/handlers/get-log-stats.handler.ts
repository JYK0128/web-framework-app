import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type GetLogStatsRequestDto, type LogStatsResponseDto } from '#/modules/log-management/dto';
import { GetLogStatsQuery } from '#/modules/log-management/queries';

@QueryHandler(GetLogStatsQuery)
export class GetLogStatsHandler implements IQueryHandler<GetLogStatsQuery, LogStatsResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogStatsQuery): Promise<LogStatsResponseDto> {
    const input = this.identify(query);
    this.verify(input);
    return this.process(input);
  }

  private identify(query: GetLogStatsQuery): GetLogStatsRequestDto | undefined {
    return query.input;
  }

  private verify(query: GetLogStatsRequestDto | undefined): void {
    if (query?.startDate && query.endDate && new Date(query.startDate) > new Date(query.endDate)) {
      throw new Error('로그 통계 시작일은 종료일보다 늦을 수 없습니다.');
    }
  }

  private process(query: GetLogStatsRequestDto | undefined): Promise<LogStatsResponseDto> {
    return this.logTelemetryService.getStats(query);
  }
}
