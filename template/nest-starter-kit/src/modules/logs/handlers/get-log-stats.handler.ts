import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LogTelemetryService } from '#/infra/log-telemetry';
import { type GetLogStatsRequestDto, type GetLogStatsResponseDto } from '#/modules/logs/dto';
import { GetLogStatsQuery } from '#/modules/logs/queries';

@QueryHandler(GetLogStatsQuery)
export class GetLogStatsHandler implements IQueryHandler<GetLogStatsQuery, GetLogStatsResponseDto> {
  constructor(private readonly logTelemetryService: LogTelemetryService) {}

  async execute(query: GetLogStatsQuery): Promise<GetLogStatsResponseDto> {
    const input = this.identify(query);
    this.verify(input);
    return this.process(input);
  }

  private identify(query: GetLogStatsQuery): GetLogStatsRequestDto {
    return query.input.query;
  }

  private verify(query: GetLogStatsRequestDto): void {
    if (query.startDate && query.endDate && new Date(query.startDate) > new Date(query.endDate)) {
      throw new Error('로그 통계 시작일은 종료일보다 늦을 수 없습니다.');
    }
  }

  private process(query: GetLogStatsRequestDto): Promise<GetLogStatsResponseDto> {
    return this.logTelemetryService.getStats(query);
  }
}
