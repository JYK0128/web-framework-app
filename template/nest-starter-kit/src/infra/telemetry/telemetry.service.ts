import { Inject, Injectable, type MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

import { type ITelemetryProvider, type QueryTelemetryLogsOptions, type QueryTelemetryLogsResult, TELEMETRY_PROVIDER, type TelemetryLogEntry, type TelemetryStatsResult } from './telemetry.interface';

@Injectable()
export class TelemetryService {
  constructor(
    @Inject(TELEMETRY_PROVIDER)
    private readonly provider: ITelemetryProvider,
  ) {}

  /**
   * 로그 목록 및 커서 페이징 조회
   */
  async getLogs(query: QueryTelemetryLogsOptions): Promise<QueryTelemetryLogsResult> {
    return this.provider.getLogs(query);
  }

  /**
   * 로그 통계 조회
   */
  async getStats(): Promise<TelemetryStatsResult> {
    return this.provider.getStats();
  }

  /**
   * 특정 로그 단건 조회
   */
  async getLogById(id: string): Promise<TelemetryLogEntry | null> {
    return this.provider.getLogById(id);
  }

  /**
   * 실시간 로그 스트리밍 (SSE)
   */
  streamLogs(): Observable<MessageEvent> {
    return this.provider.streamLogs();
  }
}
