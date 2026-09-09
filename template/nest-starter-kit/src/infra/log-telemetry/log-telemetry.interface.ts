import type { Observable } from 'rxjs';

import type { LogErrorInfoDto } from '#/modules/log-management/dto';

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
  errorInfo: LogErrorInfoDto | null
  nanoTimestamp?: string
}

export interface QueryLogOptions {
  method?: string
  statusCode?: number | string
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
}

export interface LogStatsOptions {
  startDate?: string | Date
  endDate?: string | Date
}

export interface ILogTelemetryAdapter {
  readonly providerName: string
  getLogs(query: QueryLogOptions): Promise<QueryLogResult>
  getLogById(id: string): Promise<LogEntry | null>
  getStats(options?: LogStatsOptions): Promise<LogStatsResult>
  watchLogs(): Observable<LogEntry>
}

export const LOG_TELEMETRY_ADAPTER = Symbol('LOG_TELEMETRY_ADAPTER');
export const LOG_TELEMETRY_MODULE_OPTIONS = Symbol('LOG_TELEMETRY_MODULE_OPTIONS');
