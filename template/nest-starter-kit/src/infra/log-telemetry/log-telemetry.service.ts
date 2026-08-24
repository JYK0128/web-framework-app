import { Inject, Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';

import { type ILogTelemetryAdapter, LOG_TELEMETRY_ADAPTER, type LogEntry, type LogStatsResult, type QueryLogOptions, type QueryLogResult } from './log-telemetry.interface';

@Injectable()
export class LogTelemetryService {
  constructor(
    @Inject(LOG_TELEMETRY_ADAPTER)
    private readonly adapter: ILogTelemetryAdapter,
  ) {}

  /**
   * 로그 목록 및 커서 페이징 조회
   */
  async getLogs(query: QueryLogOptions): Promise<QueryLogResult> {
    return this.adapter.getLogs(query);
  }

  /**
   * 로그 통계 조회
   */
  async getStats(): Promise<LogStatsResult> {
    return this.adapter.getStats();
  }

  /**
   * 특정 로그 단건 조회
   */
  async getLogById(id: string): Promise<LogEntry | null> {
    return this.adapter.getLogById(id);
  }

  /**
   * 실시간 로그 스트리밍 (SSE)
   */
  watchLogs(): Observable<LogEntry> {
    return this.adapter.watchLogs();
  }
}
