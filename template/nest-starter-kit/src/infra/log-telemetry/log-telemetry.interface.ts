import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

import type { ErrorDetailDto } from '#/modules/activity-logs/dto/error-detail.dto';

export interface LokiConfig {
  url: string
  timeoutMs: number
}

export interface LogTelemetryModuleOptions {
  appName: string
  loki: LokiConfig
}

export interface LogEntry {
  id: string
  createdAt: Date
  method: string
  url: string
  statusCode: number
  duration: number
  ip: string | null
  userAgent: string | null
  level: string
  emailHash: string | null
  requestId: string
  requestBody: Record<string, unknown> | null
  responseBody: Record<string, unknown> | null
  errorDetail: ErrorDetailDto | null
}

export interface QueryLogOptions {
  method?: string
  statusCode?: number
  search?: string
  limit?: number
  startDate?: string | Date
  endDate?: string | Date
  cursor?: string
}

export interface QueryLogResult {
  items: LogEntry[]
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface LogStatsResult {
  totalRequests: number
  errorCount: number
  errorRate: number
  avgDuration: number
  last24hCount: number
}

export interface ILogTelemetryProvider {
  readonly providerName: string
  getLogs(query: QueryLogOptions): Promise<QueryLogResult>
  getLogById(id: string): Promise<LogEntry | null>
  getStats(): Promise<LogStatsResult>
  streamLogs(): Observable<MessageEvent>
}

export const LOG_TELEMETRY_PROVIDER = Symbol('LOG_TELEMETRY_PROVIDER');
export const LOG_TELEMETRY_MODULE_OPTIONS = Symbol('LOG_TELEMETRY_MODULE_OPTIONS');
