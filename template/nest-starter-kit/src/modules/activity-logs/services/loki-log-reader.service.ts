import { Injectable, type MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';

import { env } from '#/env';
import { ActivityLogItemDto, type ActivityStatsResponseDto, type GetActivityLogsRequestDto, type GetActivityLogsResponseDto } from '#/modules/activity-logs/dto';

interface LokiStreamEntry {
  stream: Record<string, string>
  values: [string, string][]
}

interface LokiQueryResponse {
  status: string
  data: {
    resultType: string
    result: LokiStreamEntry[]
  }
}

function encodeCursor(log: ActivityLogItemDto): string {
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

function extractCreatedAt(obj: Record<string, unknown>): Date {
  if (typeof obj.createdAt === 'string') {
    return new Date(obj.createdAt);
  }
  if (typeof obj.timestamp === 'string') {
    return new Date(obj.timestamp);
  }
  return new Date();
}

function extractId(obj: Record<string, unknown>, fallbackTimestampNs?: string): string {
  if (typeof obj.id === 'string' && obj.id) return obj.id;
  if (typeof obj.requestId === 'string' && obj.requestId) return obj.requestId;
  if (fallbackTimestampNs) return `log-${fallbackTimestampNs}`;
  return crypto.randomUUID();
}

function extractPayloadObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function extractNestedLogMessage(obj: Record<string, unknown>): Record<string, unknown> {
  if (typeof obj.message !== 'string' || !obj.message.includes('{') || (obj.url && obj.method)) {
    return obj;
  }
  try {
    const jsonStart = obj.message.indexOf('{');
    const jsonEnd = obj.message.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const nested = JSON.parse(obj.message.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
      return { ...obj, ...nested };
    }
  }
  catch {
    // ignore nested parse error
  }
  return obj;
}

function parseLogItem(rawJson: string, fallbackTimestampNs?: string): ActivityLogItemDto | null {
  try {
    let obj = JSON.parse(rawJson) as Record<string, unknown>;
    obj = extractNestedLogMessage(obj);

    // HTTP 요청 로그가 아닌 일반 시스템 출력은 활동 로그에서 제외
    if (!obj.method || !obj.url) {
      return null;
    }

    const id = extractId(obj, fallbackTimestampNs);
    const createdAt = extractCreatedAt(obj);

    return {
      id,
      createdAt,
      method: typeof obj.method === 'string' ? obj.method : 'GET',
      url: typeof obj.url === 'string' ? obj.url : '/',
      statusCode: typeof obj.statusCode === 'number' ? obj.statusCode : 200,
      duration: typeof obj.duration === 'number' ? obj.duration : 0,
      ip: typeof obj.ip === 'string' ? obj.ip : null,
      userAgent: typeof obj.userAgent === 'string' ? obj.userAgent : null,
      level: typeof obj.level === 'string' ? obj.level : 'INFO',
      emailHash: typeof obj.emailHash === 'string' ? obj.emailHash : null,
      requestId: typeof obj.requestId === 'string' ? obj.requestId : id,
      requestBody: extractPayloadObject(obj.request ?? obj.requestBody),
      responseBody: extractPayloadObject(obj.response ?? obj.responseBody),
      errorMessage: typeof obj.errorMessage === 'string' ? obj.errorMessage : null,
    };
  }
  catch {
    return null;
  }
}

function isBypassUrl(url: string): boolean {
  return url.includes('/health') || url.includes('/activity-logs/stream');
}

@Injectable()
export class LokiLogReaderService {
  private readonly lokiBaseUrl: string;

  constructor() {
    this.lokiBaseUrl = env.LOKI_URL.endsWith('/') ? env.LOKI_URL.slice(0, -1) : env.LOKI_URL;
  }

  /**
   * Grafana Loki LogQL 쿼리 실행
   */
  private async queryLokiRange(logQl: string, limit = 500, start?: number, end?: number): Promise<ActivityLogItemDto[]> {
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

      if (!response.ok) return [];

      const body = (await response.json()) as LokiQueryResponse;
      if (body.status !== 'success' || !body.data?.result) return [];

      const logs: ActivityLogItemDto[] = [];
      for (const entry of body.data.result) {
        for (const [timestampNs, rawJson] of entry.values) {
          const item = parseLogItem(rawJson, timestampNs);
          if (item && !isBypassUrl(item.url)) {
            logs.push(item);
          }
        }
      }

      return logs;
    }
    catch {
      return [];
    }
  }

  async getLogs(query: GetActivityLogsRequestDto): Promise<GetActivityLogsResponseDto> {
    const limit = Math.min(Math.max(query.limit ?? 30, 1), 100);
    const start = query.startDate ? new Date(query.startDate).getTime() : undefined;
    const end = query.endDate ? new Date(query.endDate).getTime() : undefined;

    const allLogs = await this.queryLokiRange('{service="web-framework-app", tag="HTTP"}', 300, start, end);
    allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let filteredLogs = allLogs;
    if (query.method) {
      const m = query.method.trim().toUpperCase();
      filteredLogs = filteredLogs.filter((l) => l.method.toUpperCase() === m);
    }
    if (query.statusCode) {
      const s = Number(query.statusCode);
      filteredLogs = filteredLogs.filter((l) => l.statusCode === s);
    }
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      filteredLogs = filteredLogs.filter((l) => (
        l.url.toLowerCase().includes(q)
        || (l.ip ? l.ip.includes(q) : false)
        || (l.errorMessage ? l.errorMessage.toLowerCase().includes(q) : false)
      ));
    }

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        const [cursorTimeIso, cursorId] = decoded;
        const cursorTime = new Date(cursorTimeIso).getTime();

        const index = filteredLogs.findIndex((log) => {
          const t = new Date(log.createdAt).getTime();
          return t < cursorTime || (t === cursorTime && log.id === cursorId);
        });

        if (index >= 0) {
          filteredLogs = filteredLogs.slice(index);
        }
      }
    }

    const hasNextPage = filteredLogs.length > limit;
    const pageItems = filteredLogs.slice(0, limit);

    return {
      items: pageItems,
      totalCount: allLogs.length,
      hasNextPage,
      hasPrevPage: Boolean(query.cursor),
      startCursor: pageItems.length > 0 ? encodeCursor(pageItems[0]) : null,
      endCursor: pageItems.length > 0 ? encodeCursor(pageItems.at(-1)!) : null,
    };
  }

  async getStats(): Promise<ActivityStatsResponseDto> {
    const allLogs = await this.queryLokiRange('{service="web-framework-app", tag="HTTP"}', 500);

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

  async getLogById(id: string): Promise<ActivityLogItemDto> {
    const logQl = `{service="web-framework-app", tag="HTTP"} | json | id = "${id}" or requestId = "${id}"`;
    const logs = await this.queryLokiRange(logQl, 10);
    const found = logs.find((l) => l.id === id || l.requestId === id);
    if (!found) {
      throw new NotFoundException(`활동 로그를 찾을 수 없습니다. (ID: ${id})`);
    }
    return found;
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
            const newLogs = await this.queryLokiRange(
              '{service="web-framework-app", tag="HTTP"}',
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
          catch {
            // Keep SSE alive across transient network issues
          }
        })();
      }, 1500);

      return () => {
        clearInterval(interval);
      };
    });
  }
}
