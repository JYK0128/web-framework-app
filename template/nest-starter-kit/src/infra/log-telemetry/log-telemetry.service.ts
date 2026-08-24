import { Inject, Injectable, type MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

import { type ILogTelemetryProvider, type QueryLogOptions, type QueryLogResult, LOG_TELEMETRY_PROVIDER, type LogEntry, type LogStatsResult } from './log-telemetry.interface';

@Injectable()
export class LogTelemetryService {
  constructor(
    @Inject(LOG_TELEMETRY_PROVIDER)
    private readonly provider: ILogTelemetryProvider,
  ) {}

  /**
   * 로그 목록 및 커서 페이징 조회
   */
  async getLogs(query: QueryLogOptions): Promise<QueryLogResult> {
    return this.provider.getLogs(query);
  }

  /**
   * 로그 통계 조회
   */
  async getStats(): Promise<LogStatsResult> {
    return this.provider.getStats();
  }

  /**
   * 특정 로그 단건 조회
   */
  async getLogById(id: string): Promise<LogEntry | null> {
    return this.provider.getLogById(id);
  }

  /**
   * 실시간 로그 스트리밍 (SSE)
   */
  streamLogs(): Observable<MessageEvent> {
    return this.provider.streamLogs();
  }
}
