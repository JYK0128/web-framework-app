import { Inject, Injectable, Logger } from '@nestjs/common';
import { uuid } from '@pkg/shared/common';
import { Observable } from 'rxjs';

import { type ILogTelemetryAdapter, LOG_TELEMETRY_MODULE_OPTIONS, type LogEntry, type LogStatsResult, type LogTelemetryModuleOptions, type QueryLogOptions, type QueryLogResult } from '#/infra/log-telemetry/log-telemetry.interface';
import { ErrorDetailDto } from '#/modules/activity-logs/dto/error-detail.dto';

export interface LokiStreamEntry {
  stream: Record<string, string>
  values: [string, string][]
}

export interface LokiQueryResponse {
  status: string
  data: {
    resultType: string
    result: LokiStreamEntry[]
  }
}

function encodeCursor(log: LogEntry): string {
  return Buffer.from(JSON.stringify([new Date(log.createdAt).toISOString(), log.id])).toString('base64');
}

function decodeCursor(cursor: string): [string, string] | null {
  const raw = Buffer.from(cursor, 'base64').toString('utf-8');
  const parsed = JSON.safeParse<unknown>(raw, null);
  if (Array.isArray(parsed) && parsed.length >= 2) {
    return [String(parsed[0]), String(parsed[1])];
  }
  return null;
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

function parseLogItem(rawJson: string): LogEntry | null {
  const obj = JSON.safeParse<Record<string, unknown> | null>(rawJson, null);
  if (!obj || typeof obj !== 'object') return null;

  const createdAt = parseCreatedAt(obj);
  if (!createdAt) return null;

  const id = parseString(obj.id) ?? parseString(obj.requestId) ?? uuid();
  const requestId = parseString(obj.requestId) ?? id;
  const statusCode = parseNumber(obj.statusCode ?? obj.status, 200);
  const level = parseString(obj.level, 'info') ?? 'info';
  const isError = statusCode >= 400 || level === 'error';
  const responseBody = extractPayloadObject(obj.responseBody ?? obj.response);
  const errorDetail = isError
    ? ErrorDetailDto.from(obj.errorDetail ?? obj.error, responseBody)
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
    errorDetail,
  };
}

function escapeLogQLRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeLogQLString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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
  async queryRange(logQl: string, limit = 500, start?: number, end?: number): Promise<LogEntry[]> {
    const url = new URL(`${this.lokiBaseUrl}/loki/api/v1/query_range`);
    url.searchParams.set('query', logQl);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('direction', 'backward');

    if (start) {
      url.searchParams.set('start', String(start * 1_000_000));
    }
    if (end) {
      url.searchParams.set('end', String(end * 1_000_000));
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

      const logs: LogEntry[] = [];
      for (const entry of body.data.result) {
        for (const [, rawJson] of entry.values) {
          const item = parseLogItem(rawJson);
          if (item) {
            logs.push(item);
          }
        }
      }

      return logs;
    }
    catch (err) {
      this.logger.error(`Loki query request failed: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  buildLogQL(query?: Partial<Pick<QueryLogOptions, 'method' | 'statusCode' | 'search'>>): string {
    let logQL = `{tag="${this.httpTag}"} | json | url !~ ".*health.*"`;

    if (query?.method?.trim()) {
      const method = escapeLogQLString(query.method.trim().toUpperCase());
      logQL += ` | method = "${method}"`;
    }

    if (query?.statusCode !== undefined) {
      logQL += ` | statusCode = "${Number(query.statusCode)}"`;
    }

    if (query?.search?.trim()) {
      const escaped = escapeLogQLString(escapeLogQLRegex(query.search.trim()));
      logQL += ` |~ "(?i)${escaped}"`;
    }

    return logQL;
  }

  async getLogs(query: QueryLogOptions): Promise<QueryLogResult> {
    const limit = Math.min(Math.max(query.limit ?? 30, 1), 100);
    const startMs = query.startDate ? new Date(query.startDate).getTime() : undefined;
    const userEndMs = query.endDate ? new Date(query.endDate).getTime() : undefined;
    const logQL = this.buildLogQL(query);

    let pageEndMs = userEndMs;
    let cursorTimeMs: number | undefined;
    let cursorId: string | undefined;

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        const [cursorTimeIso, decodedId] = decoded;
        cursorTimeMs = new Date(cursorTimeIso).getTime();
        pageEndMs = cursorTimeMs + 1;
        cursorId = decodedId;
      }
    }

    const rawPage = await this.queryRange(logQL, limit + 2, startMs, pageEndMs);
    rawPage.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let slicedPage = rawPage;
    if (cursorId !== undefined && cursorTimeMs !== undefined) {
      const idx = slicedPage.findIndex((log) => log.id === cursorId);
      if (idx !== -1) {
        slicedPage = slicedPage.slice(idx + 1);
      }
      else {
        slicedPage = slicedPage.filter((log) => new Date(log.createdAt).getTime() < cursorTimeMs);
      }
    }

    const countLogs = await this.queryRange(logQL, 5000, startMs, userEndMs);
    const totalCount = countLogs.length;

    const hasNextPage = slicedPage.length > limit;
    const pageItems = slicedPage.slice(0, limit);

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

  async getStats(): Promise<LogStatsResult> {
    const allLogs = await this.queryRange(
      this.buildLogQL(),
      5000,
    );

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let errorCount = 0;
    let totalDuration = 0;
    let last24hCount = 0;

    for (const log of allLogs) {
      if (log.statusCode >= 400) errorCount++;
      totalDuration += log.duration || 0;
      if (new Date(log.createdAt).getTime() >= oneDayAgo) last24hCount++;
    }

    const totalRequests = allLogs.length;
    const errorRate = totalRequests > 0 ? Number(((errorCount / totalRequests) * 100).toFixed(1)) : 0;
    const avgDuration = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    return {
      totalRequests,
      errorCount,
      errorRate,
      avgDuration,
      last24hCount,
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
