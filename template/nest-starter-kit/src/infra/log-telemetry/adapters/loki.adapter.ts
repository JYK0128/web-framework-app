import { Inject, Injectable, Logger } from '@nestjs/common';
import { jsonSafeParse, uuid, when } from '@pkg/shared/common';
import { Observable } from 'rxjs';

import { type ILogTelemetryAdapter, LOG_TELEMETRY_MODULE_OPTIONS, type LogEntry, type LogStatsResult, type LogTelemetryModuleOptions, type QueryLogOptions, type QueryLogResult } from '#/infra/log-telemetry/log-telemetry.interface';
import { LogErrorInfoDto } from '#/modules/log-management/dto';

export interface LokiStreamEntry {
  stream: Record<string, string>
  values: [string, string][]
}

export interface LokiVectorEntry {
  metric: Record<string, string>
  value: [number, string]
}

export interface LokiQueryResponse {
  status: string
  data: {
    resultType: string
    result: (LokiStreamEntry | LokiVectorEntry)[]
  }
}

function encodeCursor(log: LogEntry): string {
  if (log.nanoTimestamp) {
    return Buffer.from(JSON.stringify([log.nanoTimestamp, log.id])).toString('base64');
  }
  return Buffer.from(JSON.stringify([String(new Date(log.createdAt).getTime() * 1_000_000), log.id])).toString('base64');
}

export interface DecodedCursor {
  nanoTimestamp: string
  logId: string
}

function decodeCursor(cursor: string): DecodedCursor | null {
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = jsonSafeParse<unknown>(raw);
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return {
        nanoTimestamp: String(parsed[0]),
        logId: String(parsed[1]),
      };
    }
    return null;
  }
  catch {
    return null;
  }
}

function compareLogDescending(a: LogEntry, b: LogEntry): number {
  if (a.nanoTimestamp && b.nanoTimestamp && a.nanoTimestamp !== b.nanoTimestamp) {
    return BigInt(b.nanoTimestamp) > BigInt(a.nanoTimestamp) ? 1 : -1;
  }
  const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return b.id.localeCompare(a.id);
}

function extractPayloadObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseString(value: unknown, fallback: string | null = null): string | null {
  return typeof value === 'string' ? value : fallback;
}

function parseNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function parseCreatedAt(obj: Record<string, unknown>): Date | null {
  const str = parseString(obj.createdAt) ?? parseString(obj.timestamp);
  if (!str) return new Date();
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseLogItem(rawJson: string, nanoTimestamp?: string): LogEntry | null {
  const obj = jsonSafeParse<Record<string, unknown>>(rawJson);
  if (!obj || typeof obj !== 'object') return null;

  const createdAt = parseCreatedAt(obj);
  if (!createdAt) return null;

  const id = parseString(obj.id) ?? parseString(obj.requestId) ?? uuid();
  const requestId = parseString(obj.requestId) ?? id;
  const statusCode = parseNumber(obj.statusCode ?? obj.status, 200);
  const level = parseString(obj.level, 'info') ?? 'info';
  const isError = statusCode >= 400 || level === 'error';
  const responseBody = extractPayloadObject(obj.responseBody ?? obj.response);
  const errorInfo = isError
    ? LogErrorInfoDto.from(obj.errorInfo ?? obj.errorDetail ?? obj.error, responseBody)
    : null;

  return {
    id,
    createdAt,
    method: parseString(obj.method, 'GET') ?? 'GET',
    url: parseString(obj.url, '/') ?? '/',
    statusCode,
    duration: parseNumber(obj.duration, 0),
    ip: parseString(obj.ip),
    userAgent: parseString(obj.userAgent),
    level,
    emailHash: parseString(obj.emailHash),
    requestId,
    requestBody: extractPayloadObject(obj.requestBody ?? obj.request),
    responseBody,
    errorInfo,
    nanoTimestamp,
  };
}

function escapeLogQLRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeLogQLString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function toNanosecondsString(value: number | string): string {
  return typeof value === 'string' && value.length > 13 ? value : String(Number(value) * 1_000_000);
}

function parseStreamEntries(results: (LokiStreamEntry | LokiVectorEntry)[]): LogEntry[] {
  const logs: LogEntry[] = [];
  for (const entry of results) {
    if ('values' in entry && Array.isArray(entry.values)) {
      for (const [timestampNs, rawJson] of entry.values) {
        const item = parseLogItem(rawJson, timestampNs);
        if (item) {
          logs.push(item);
        }
      }
    }
  }
  return logs.sort(compareLogDescending);
}

function resolveCursorBoundary(cursor?: string): { queryEnd?: string, skipLogId: string | null } {
  if (!cursor) return { skipLogId: null };
  const decoded = decodeCursor(cursor);
  if (!decoded) return { skipLogId: null };

  const cursorTimeRaw = decoded.nanoTimestamp;
  if (/^\d{15,}$/.test(cursorTimeRaw)) {
    return { queryEnd: cursorTimeRaw, skipLogId: decoded.logId };
  }

  const parsedMs = new Date(cursorTimeRaw).getTime();
  if (!Number.isNaN(parsedMs)) {
    return { queryEnd: (BigInt(parsedMs) * 1_000_000n).toString(), skipLogId: decoded.logId };
  }

  return { skipLogId: decoded.logId };
}

@Injectable()
export class LokiLogTelemetryAdapter implements ILogTelemetryAdapter {
  readonly providerName = 'loki';
  private readonly logger = new Logger(LokiLogTelemetryAdapter.name);
  private readonly lokiBaseUrl: string;
  private readonly appName: string;
  private readonly timeoutMs: number;

  constructor(
    @Inject(LOG_TELEMETRY_MODULE_OPTIONS)
    options: LogTelemetryModuleOptions,
  ) {
    this.lokiBaseUrl = options.loki.url.replace(/\/$/, '');
    this.appName = options.appName;
    this.timeoutMs = options.loki.timeoutMs;
  }

  private get httpTag(): string {
    return `${this.appName}:HTTP`;
  }

  /**
   * Grafana Loki LogQL 쿼리 실행
   */
  async queryRange(logQl: string, limit = 500, start?: number | string, end?: number | string): Promise<LogEntry[]> {
    const url = new URL(`${this.lokiBaseUrl}/loki/api/v1/query_range`);
    url.searchParams.set('query', logQl);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('direction', 'backward');

    if (start !== undefined) {
      url.searchParams.set('start', toNanosecondsString(start));
    }
    if (end !== undefined) {
      url.searchParams.set('end', toNanosecondsString(end));
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Loki query responded with ${response.status}: ${await response.text()}`);
      }

      const body = (await response.json()) as LokiQueryResponse;
      if (body.status !== 'success' || !body.data?.result) {
        throw new Error('Loki query returned an invalid response');
      }

      return parseStreamEntries(body.data.result);
    }
    catch (err) {
      this.logger.error(`Loki query request failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  /**
   * Grafana Loki LogQL count_over_time 메트릭 쿼리 실행
   */
  async countOverTime(logQl: string, start?: number, end?: number): Promise<number> {
    const endMs = end ?? Date.now();
    // 시작 시점이 없으면 최근 24시간 전부터 카운트
    const startMs = start ?? endMs - 24 * 60 * 60 * 1000;
    const durationSeconds = Math.max(Math.ceil((endMs - startMs) / 1000), 1);

    const metricQuery = `sum(count_over_time(${logQl} [${durationSeconds}s]))`;
    const url = new URL(`${this.lokiBaseUrl}/loki/api/v1/query`);
    url.searchParams.set('query', metricQuery);
    url.searchParams.set('time', String(Math.floor(endMs / 1000)));

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Loki metric query responded with ${response.status}: ${await response.text()}`);
      }

      const body = (await response.json()) as LokiQueryResponse;
      if (body.status !== 'success' || !Array.isArray(body.data?.result)) {
        return 0;
      }

      const firstResult = body.data.result[0];
      if (firstResult && 'value' in firstResult && Array.isArray(firstResult.value)) {
        const parsed = Number.parseInt(firstResult.value[1], 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      }

      return 0;
    }
    catch (err) {
      this.logger.error(`Loki countOverTime query failed: ${err instanceof Error ? err.message : String(err)}`);
      return 0;
    }
  }

  buildLogQL(query?: Partial<Pick<QueryLogOptions, 'method' | 'statusCode' | 'search'>>): string {
    let logQL = `{tag="${this.httpTag}"} | json | url !~ ".*health.*"`;

    if (query?.method?.trim()) {
      const methods = query.method
        .split(',')
        .map((m) => escapeLogQLString(m.trim().toUpperCase()))
        .filter(Boolean);
      if (methods.length === 1) {
        logQL += ` | method = "${methods[0]}"`;
      }
      else if (methods.length > 1) {
        logQL += ` | method =~ "(?i)^(${methods.join('|')})$"`;
      }
    }

    if (query?.statusCode !== undefined && String(query.statusCode).trim() !== '') {
      const codes = String(query.statusCode)
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (codes.length === 1) {
        logQL += ` | statusCode = "${Number(codes[0])}"`;
      }
      else if (codes.length > 1) {
        logQL += ` | statusCode =~ "^(${codes.join('|')})$"`;
      }
    }

    if (query?.search?.trim()) {
      const escaped = escapeLogQLString(escapeLogQLRegex(query.search.trim()));
      logQL += ` |~ "(?i)${escaped}"`;
    }

    return logQL;
  }

  async getLogs(query: QueryLogOptions): Promise<QueryLogResult> {
    const limit = Math.min(Math.max(query.limit ?? 30, 1), 100);
    const startMs = when((value): value is string => Boolean(value), (startDate) => new Date(startDate).getTime())(query.startDate);
    const userEndMs = when((value): value is string => Boolean(value), (endDate) => new Date(endDate).getTime())(query.endDate);
    const logQL = this.buildLogQL(query);

    const { queryEnd = userEndMs, skipLogId } = resolveCursorBoundary(query.cursor);
    const fetchLimit = skipLogId ? limit + 20 : limit + 1;

    const [rawPage, totalCount] = await Promise.all([
      this.queryRange(logQL, fetchLimit, startMs, queryEnd),
      this.countOverTime(logQL, startMs, userEndMs),
    ]);

    let filteredLogs = rawPage;
    if (skipLogId) {
      const skipIndex = rawPage.findIndex((item) => item.id === skipLogId);
      if (skipIndex !== -1) {
        filteredLogs = rawPage.slice(skipIndex + 1);
      }
    }

    const hasNextPage = filteredLogs.length > limit;
    const pageItems = filteredLogs.slice(0, limit);

    const firstItem = pageItems.at(0);
    const lastItem = pageItems.at(-1);

    return {
      items: pageItems,
      totalCount,
      hasNextPage,
      hasPrevPage: Boolean(query.cursor),
      startCursor: firstItem ? encodeCursor(firstItem) : null,
      endCursor: lastItem ? encodeCursor(lastItem) : null,
    };
  }

  async getStats(options?: { startDate?: string | Date, endDate?: string | Date }): Promise<LogStatsResult> {
    const baseQL = this.buildLogQL();
    const errorQL = `${baseQL} | statusCode >= 400`;

    const now = Date.now();
    const userEndMs = when((value): value is string | Date => Boolean(value), (d) => new Date(d).getTime())(options?.endDate) ?? now;
    const userStartMs = when((value): value is string | Date => Boolean(value), (d) => new Date(d).getTime())(options?.startDate) ?? userEndMs - 24 * 60 * 60 * 1000;

    const [totalRequests, errorCount, recentLogs] = await Promise.all([
      this.countOverTime(baseQL, userStartMs, userEndMs),
      this.countOverTime(errorQL, userStartMs, userEndMs),
      this.queryRange(baseQL, 500, userStartMs, userEndMs).catch(() => []),
    ]);

    let totalDuration = 0;
    for (const log of recentLogs) {
      totalDuration += log.duration || 0;
    }

    const errorRate = totalRequests > 0 ? Number(((errorCount / totalRequests) * 100).toFixed(1)) : 0;
    const avgDuration = recentLogs.length > 0 ? Math.round(totalDuration / recentLogs.length) : 0;

    return {
      totalRequests,
      errorCount,
      errorRate,
      avgDuration,
    };
  }

  async getLogById(id: string): Promise<LogEntry | null> {
    const logQl = `{tag="${this.httpTag}"} |~ "${escapeLogQLRegex(id)}"`;
    const logs = await this.queryRange(logQl, 10);
    return logs.find((l) => l.id === id || l.requestId === id) ?? null;
  }

  watchLogs(): Observable<LogEntry> {
    return new Observable<LogEntry>((subscriber) => {
      let lastSeenTimestamp = Date.now();
      const seenIds = new Set<string>();

      const interval = setInterval(() => {
        void (async () => {
          try {
            const now = Date.now();
            const newLogs = await this.queryRange(
              this.buildLogQL(),
              50,
              lastSeenTimestamp - 3000,
              now,
            );

            for (const log of newLogs) {
              if (!seenIds.has(log.id)) {
                seenIds.add(log.id);
                subscriber.next(log);
              }
            }

            if (seenIds.size > 2000) {
              const deleteCount = seenIds.size - 1000;
              let count = 0;
              for (const id of seenIds) {
                seenIds.delete(id);
                count += 1;
                if (count >= deleteCount) break;
              }
            }
            lastSeenTimestamp = now;
          }
          catch (error) {
            this.logger.warn(
              `Loki stream poll failed: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        })();
      }, 1500);

      return () => {
        clearInterval(interval);
      };
    });
  }
}
