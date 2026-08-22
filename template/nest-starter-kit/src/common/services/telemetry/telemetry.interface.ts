import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

export type TelemetryProviderType = 'loki';

export interface TelemetryModuleOptions {
  provider?: TelemetryProviderType
  url?: string
}

export interface TelemetryLogEntry {
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
  errorMessage: string | null
}

export interface QueryTelemetryLogsOptions {
  method?: string
  statusCode?: number
  search?: string
  limit?: number
  startDate?: string | Date
  endDate?: string | Date
  cursor?: string
}

export interface QueryTelemetryLogsResult {
  items: TelemetryLogEntry[]
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface TelemetryStatsResult {
  totalRequests: number
  errorCount: number
  errorRate: number
  avgDuration: number
  last24hCount: number
}

export interface ITelemetryProvider {
  readonly providerName: string
  getLogs(query: QueryTelemetryLogsOptions): Promise<QueryTelemetryLogsResult>
  getLogById(id: string): Promise<TelemetryLogEntry | null>
  getStats(): Promise<TelemetryStatsResult>
  streamLogs(): Observable<MessageEvent>
}

export const TELEMETRY_PROVIDER = Symbol('TELEMETRY_PROVIDER');
export const TELEMETRY_MODULE_OPTIONS = Symbol('TELEMETRY_MODULE_OPTIONS');
