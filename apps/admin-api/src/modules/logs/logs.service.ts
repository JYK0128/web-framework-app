import { Injectable } from '@nestjs/common';

import { type LogEntry, LogTelemetryService } from '#/infra/log-telemetry';

import type { GetLogsRequestDto } from './dto/get-logs.request.dto';

@Injectable()
export class LogsService {
  constructor(private readonly telemetry: LogTelemetryService) {}

  async list(input: GetLogsRequestDto) {
    const { search, method, status, page, limit } = input;
    const offset = (page - 1) * limit;
    const result = await this.telemetry.getLogs({
      search,
      method,
      status,
      limit,
      offset,
    });
    return {
      items: result.items.map((item) => this.toItem(item)),
      page,
      totalPages: Math.ceil(result.totalCount / limit),
      hasNextPage: page * limit < result.totalCount,
      hasPrevPage: page > 1 && result.totalCount > 0,
      totalCount: result.totalCount,
    };
  }

  async stats() {
    const stats = await this.telemetry.getStats();
    return {
      total: stats.totalRequests,
      errors: stats.errorCount,
      averageDurationMs: stats.avgDuration,
      errorRate: stats.errorRate,
    };
  }

  private toItem(item: LogEntry) {
    return {
      id: item.id,
      createdAt: item.createdAt,
      level: item.level,
      method: item.method,
      path: item.url,
      statusCode: item.statusCode,
      durationMs: item.duration,
      requestId: item.requestId,
      ipAddress: item.ip,
      userAgent: item.userAgent,
      errorMessage: item.errorInfo?.message ?? null,
    };
  }
}
