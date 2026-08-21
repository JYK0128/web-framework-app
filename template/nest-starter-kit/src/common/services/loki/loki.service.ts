import { Inject, Injectable, Logger, type MessageEvent, Optional } from '@nestjs/common';
import { Observable } from 'rxjs';

import { env } from '#/env';

export const LOKI_MODULE_OPTIONS = Symbol('LOKI_MODULE_OPTIONS');

export interface LokiModuleOptions {
  url?: string
}

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

export interface LokiLogEntry {
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

export interface QueryLokiLogsOptions {
  method?: string
  statusCode?: number
  search?: string
  limit?: number
  startDate?: string | Date
  endDate?: string | Date
  cursor?: string
}

export interface QueryLokiLogsResult {
  items: LokiLogEntry[]
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface LokiStatsResult {
  totalRequests: number
  errorCount: number
  errorRate: number
  avgDuration: number
  last24hCount: number
}

function encodeCursor(log: LokiLogEntry): string {
  return Buffer.from(JSON.stringify([new Date(log.createdAt).toISOString(), log.id])).toString('base64');
}

function decodeCursor(cursor: string): [string, string] | null {
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return [String(parsed[0]), String(parsed[1])];
    }
    return null;
  }
  catch {
    return null;
  }
}

function extractPayloadObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseLogItem(rawJson: string): LokiLogEntry {
  const obj = JSON.parse(rawJson) as Record<string, unknown>;
  if (
    typeof obj.id !== 'string'
    || typeof obj.createdAt !== 'string'
    || typeof obj.method !== 'string'
    || typeof obj.url !== 'string'
    || typeof obj.statusCode !== 'number'
    || typeof obj.duration !== 'number'
    || typeof obj.level !== 'string'
    || typeof obj.requestId !== 'string'
  ) {
    throw new Error('Loki log entry does not match the current schema');
  }

  const createdAt = new Date(obj.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error('Loki log entry has an invalid createdAt value');
  }

  return {
    id: obj.id,
    createdAt,
    method: obj.method,
    url: obj.url,
    statusCode: obj.statusCode,
    duration: obj.duration,
    ip: typeof obj.ip === 'string' ? obj.ip : null,
    userAgent: typeof obj.userAgent === 'string' ? obj.userAgent : null,
    level: obj.level,
    emailHash: typeof obj.emailHash === 'string' ? obj.emailHash : null,
    requestId: obj.requestId,
    requestBody: extractPayloadObject(obj.requestBody),
    responseBody: extractPayloadObject(obj.responseBody),
    errorMessage: typeof obj.errorMessage === 'string' ? obj.errorMessage : null,
  };
}

function isBypassUrl(url: string): boolean {
  return url.includes('/health') || url.includes('/activity-logs/stream');
}

function escapeLogQLRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class LokiService {
  private readonly logger = new Logger(LokiService.name);
  private readonly lokiBaseUrl: string;

  constructor(
    @Optional()
    @Inject(LOKI_MODULE_OPTIONS)
    options?: LokiModuleOptions,
  ) {
    const rawUrl = options?.url ?? env.LOKI_URL;
    this.lokiBaseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
  }

  /**
   * Grafana Loki LogQL 쿼리 실행
   */
  async queryRange(logQl: string, limit = 500, start?: number, end?: number): Promise<LokiLogEntry[]> {
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
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Loki query responded with ${response.status}: ${await response.text()}`);
      }

      const body = (await response.json()) as LokiQueryResponse;
      if (body.status !== 'success' || !body.data?.result) {
        throw new Error('Loki query returned an invalid response');
      }

      const logs: LokiLogEntry[] = [];
      for (const entry of body.data.result) {
        for (const [, rawJson] of entry.values) {
          const item = parseLogItem(rawJson);
          if (!isBypassUrl(item.url)) {
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

  /**
   * LogQL 생성 헬퍼
   */
  buildLogQL(query?: Partial<Pick<QueryLokiLogsOptions, 'method' | 'statusCode' | 'search'>>): string {
    let logQL = '{service="web-framework-app", tag="HTTP"} | json | url !~ ".*(health|activity-logs/stream).*"';

    if (query?.method?.trim()) {
      const method = query.method.trim().toUpperCase();
      logQL += ` | method = "${method}"`;
    }

    if (query?.statusCode) {
      logQL += ` | statusCode = "${Number(query.statusCode)}"`;
    }

    if (query?.search?.trim()) {
      const escaped = escapeLogQLRegex(query.search.trim());
      logQL += ` |~ "(?i)${escaped}"`;
    }

    return logQL;
  }

  /**
   * 로그 목록 및 커서 페이징 조회
   */
  async getLogs(query: QueryLokiLogsOptions): Promise<QueryLokiLogsResult> {
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

    return {
      items: pageItems,
      totalCount,
      hasNextPage,
      hasPrevPage: Boolean(query.cursor),
      startCursor: pageItems.length > 0 ? encodeCursor(pageItems[0]) : null,
      endCursor: pageItems.length > 0 ? encodeCursor(pageItems.at(-1)!) : null,
    };
  }

  /**
   * 통계 조회
   */
  async getStats(): Promise<LokiStatsResult> {
    const allLogs = await this.queryRange(
      '{service="web-framework-app", tag="HTTP"} | json | url !~ ".*(health|activity-logs/stream).*"',
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

  /**
   * 단건 조회
   */
  async getLogById(id: string): Promise<LokiLogEntry | null> {
    const logQl = `{service="web-framework-app", tag="HTTP"} | json | id = "${id}" or requestId = "${id}"`;
    const logs = await this.queryRange(logQl, 10);
    return logs.find((l) => l.id === id || l.requestId === id) ?? null;
  }

  /**
   * 실시간 로그 스트리밍 (SSE Observable)
   */
  streamLogs(): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let lastSeenTimestamp = Date.now();
      const seenIds = new Set<string>();

      const interval = setInterval(() => {
        void (async () => {
          try {
            const now = Date.now();
            const newLogs = await this.queryRange(
              '{service="web-framework-app", tag="HTTP"} | json | url !~ ".*(health|activity-logs/stream).*"',
              50,
              lastSeenTimestamp - 3000,
              now,
            );

            for (const log of newLogs) {
              if (!seenIds.has(log.id)) {
                seenIds.add(log.id);
                subscriber.next({
                  data: log,
                  type: 'activity-log',
                });
              }
            }

            if (seenIds.size > 2000) {
              seenIds.clear();
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
