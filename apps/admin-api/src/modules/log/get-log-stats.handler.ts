import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LogTelemetryService } from '@pkg/server-core/log-telemetry/log-telemetry.service';

import { GetLogStatsQuery } from '#/modules/log/get-log-stats.query';
import { GetLogStatsResponseDto } from '#/modules/log/get-log-stats.response.dto';

@Injectable()
@QueryHandler(GetLogStatsQuery)
export class GetLogStatsHandler implements IQueryHandler<GetLogStatsQuery, GetLogStatsResponseDto> {
  constructor(private readonly telemetry: LogTelemetryService) {}
  async execute(): Promise<GetLogStatsResponseDto> {
    const stats = await this.telemetry.getStats();
    return GetLogStatsResponseDto.parse({
      total: stats.totalRequests,
      errors: stats.errorCount,
      averageDurationMs: stats.avgDuration,
      errorRate: stats.errorRate,
    });
  }
}
