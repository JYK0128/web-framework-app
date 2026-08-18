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

function escapeLogQLRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  /**
   * method / statusCode / search 조건을 LogQL 레벨에서 필터링하는 쿼리 빌더
   */
  private buildLogQL(query?: Partial<Pick<GetActivityLogsRequestDto, 'method' | 'statusCode' | 'search'>>): string {
    // 기본 스트림 선택 + JSON 파싱 + bypass URL 제외
    let logQL = '{service="web-framework-app", tag="HTTP"} | json | url !~ ".*(health|activity-logs/stream).*"';

    if (query?.method?.trim()) {
      const method = query.method.trim().toUpperCase();
      logQL += ` | method = "${method}"`;
    }

    if (query?.statusCode) {
      // json 파싱 후 숫자 필드도 Loki 레이블에서는 문자열로 비교
      logQL += ` | statusCode = "${Number(query.statusCode)}"`;
    }

    if (query?.search?.trim()) {
      // 라인 전체(raw JSON)에서 대소문자 무관 검색 → url / ip / errorMessage 모두 커버
      const escaped = escapeLogQLRegex(query.search.trim());
      logQL += ` |~ "(?i)${escaped}"`;
    }

    return logQL;
  }

  async getLogs(query: GetActivityLogsRequestDto): Promise<GetActivityLogsResponseDto> {
    const limit = Math.min(Math.max(query.limit ?? 30, 1), 100);
    const startMs = query.startDate ? new Date(query.startDate).getTime() : undefined;
    const userEndMs = query.endDate ? new Date(query.endDate).getTime() : undefined;
    const logQL = this.buildLogQL(query);

    // 커서 파싱 → Loki end 파라미터 결정
    let pageEndMs = userEndMs;
    let cursorTimeMs: number | undefined;
    let cursorId: string | undefined;

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      if (decoded) {
        const [cursorTimeIso, decodedId] = decoded;
        cursorTimeMs = new Date(cursorTimeIso).getTime();
        // +1ms: 커서 시점을 포함(inclusive)시켜 동일 ms 항목은 ID로 중복 제거
        pageEndMs = cursorTimeMs + 1;
        cursorId = decodedId;
      }
    }

    // ── 페이지 쿼리: Loki end 기반, limit+2 개만 pull ──
    const rawPage = await this.queryLokiRange(logQL, limit + 2, startMs, pageEndMs);
    rawPage.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 커서 아이템 중복 제거 (ID로 정확히 찾아 그 이후부터 사용)
    let slicedPage = rawPage;
    if (cursorId !== undefined && cursorTimeMs !== undefined) {
      const idx = slicedPage.findIndex(log => log.id === cursorId);
      if (idx !== -1) {
        // 커서 아이템 + 그보다 최신(이전 페이지에 포함된) 항목 제거
        slicedPage = slicedPage.slice(idx + 1);
      }
      else {
        // 커서 아이템이 window에 없는 경우 (엣지케이스): 시간 기반 fallback
        slicedPage = slicedPage.filter(log => new Date(log.createdAt).getTime() < cursorTimeMs!);
      }
    }

    // ── 카운트 쿼리: 전체 범위, 최대 5000 (페이지 쿼리와 분리) ──
    const countLogs = await this.queryLokiRange(logQL, 5000, startMs, userEndMs);
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

  async getStats(): Promise<ActivityStatsResponseDto> {
    const allLogs = await this.queryLokiRange(
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
