import { useI18n } from '@pkg/shared/web';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, type Row } from '@tanstack/react-table';
import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw, Search, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#/.generated/shadcn/components/ui';
import { DataGrid, useDataGrid } from '#/components/data-grid';
import { axios } from '#/core/config/axios';

import { ActivityLogDetailDialog, type ActivityLogItem } from './-components/ActivityLogDetailDialog';

interface ActivityStats {
  totalRequests: number
  errorCount: number
  errorRate: number
  avgDuration: number
  last24hCount: number
}

interface GetActivityLogsResponse {
  items: ActivityLogItem[]
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startCursor: string | null
  endCursor: string | null
}

const initialStats: ActivityStats = {
  totalRequests: 0,
  errorCount: 0,
  errorRate: 0,
  avgDuration: 0,
  last24hCount: 0,
};

const columnHelper = createColumnHelper<ActivityLogItem>();

function getMethodClass(method: string): string {
  switch (method) {
    case 'GET':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400';
    case 'POST':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    case 'DELETE':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
    default:
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  }
}

export const Route = createFileRoute('/_protected/_app/activity-logs/')({
  loader: async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        axios<GetActivityLogsResponse>({
          url: '/api/v1/activity-logs',
          method: 'GET',
          params: { limit: 30 },
        }),
        axios<ActivityStats>({
          url: '/api/v1/activity-logs/stats',
          method: 'GET',
        }),
      ]);

      return {
        initialLogs: logsRes,
        initialStats: statsRes,
      };
    }
    catch {
      return {
        initialLogs: { items: [], totalCount: 0, hasNextPage: false, hasPrevPage: false, startCursor: null, endCursor: null },
        initialStats,
      };
    }
  },
  component: ActivityLogsPage,
});

function parseStreamPayload(eventData: string): ActivityLogItem | null {
  try {
    let payload = JSON.parse(eventData) as ActivityLogItem | { data?: string | ActivityLogItem };
    if ('data' in payload && payload.data) {
      payload = typeof payload.data === 'string' ? (JSON.parse(payload.data) as ActivityLogItem) : payload.data;
    }
    const newLog = payload as ActivityLogItem;
    if (!newLog?.id || !newLog?.method) return null;
    return newLog;
  }
  catch {
    return null;
  }
}

function mergeStreamedLog(prev: ActivityLogItem[], newLog: ActivityLogItem): ActivityLogItem[] {
  for (const item of prev) {
    if (item.id === newLog.id) return prev;
  }
  return [newLog, ...prev.slice(0, 99)];
}

function matchesSearch(log: ActivityLogItem, q: string): boolean {
  if (!q) return true;
  return (
    log.url.toLowerCase().includes(q)
    || Boolean(log.emailHash?.toLowerCase().includes(q))
    || Boolean(log.ip?.includes(q))
    || Boolean(log.errorMessage?.toLowerCase().includes(q))
  );
}

function filterActivityLogs(
  logs: ActivityLogItem[],
  methodFilter: string,
  statusFilter: string,
  search: string,
): ActivityLogItem[] {
  const cleanSearch = search.trim().toLowerCase();

  return logs.filter((log) => {
    if (methodFilter !== 'ALL' && log.method.toUpperCase() !== methodFilter.toUpperCase()) return false;
    if (statusFilter !== 'ALL' && String(log.statusCode) !== statusFilter) return false;
    return matchesSearch(log, cleanSearch);
  });
}

function ActivityLogsPage() {
  const { initialLogs, initialStats: initialStatsData } = Route.useLoaderData();
  const { t, language } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  // 필터 상태
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isLive, setIsLive] = useState<boolean>(true);

  // 실시간 스트림 수신 로그 상태
  const [streamedLogs, setStreamedLogs] = useState<ActivityLogItem[]>([]);

  // 상세 모달 상태
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // REST API 무한 커서 기반 로그 쿼리
  const {
    data: infiniteLogsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['activity-logs', methodFilter, statusFilter, debouncedSearch],
    queryFn: ({ pageParam }) => axios<GetActivityLogsResponse>({
      url: '/api/v1/activity-logs',
      method: 'GET',
      params: {
        method: methodFilter !== 'ALL' ? methodFilter : undefined,
        statusCode: statusFilter !== 'ALL' ? Number(statusFilter) : undefined,
        search: debouncedSearch || undefined,
        limit: 30,
        cursor: pageParam || undefined,
      },
    }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.endCursor : undefined),
    initialData: {
      pages: [initialLogs],
      pageParams: [null],
    },
  });

  // 통계 요약 쿼리
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['activity-logs-stats'],
    queryFn: () => axios<ActivityStats>({
      url: '/api/v1/activity-logs/stats',
      method: 'GET',
    }),
    initialData: initialStatsData,
  });

  // 실시간 SSE 스트리밍
  useEffect(() => {
    if (!isLive) return;

    const eventSource = new EventSource('/api/v1/activity-logs/stream');

    const handleMessage = (event: MessageEvent<string>) => {
      const newLog = parseStreamPayload(event.data);
      if (!newLog) return;
      setStreamedLogs((prev) => mergeStreamedLog(prev, newLog));
    };

    eventSource.addEventListener('activity-log', handleMessage);
    eventSource.onmessage = handleMessage;

    return () => {
      eventSource.removeEventListener('activity-log', handleMessage);
      eventSource.onmessage = null;
      eventSource.close();
    };
  }, [isLive]);

  // 무한 쿼리 페이지들을 1차원 배열로 평탄화
  const fetchedLogs = useMemo(() => {
    const pages = infiniteLogsData?.pages ?? [];
    const allItems: ActivityLogItem[] = [];
    for (const page of pages) {
      if (page.items) {
        allItems.push(...page.items);
      }
    }
    return allItems;
  }, [infiniteLogsData?.pages]);

  // 병합된 로그 목록 (실시간 수신 로그 + 누적 조회 로그) 및 실시간 필터링
  const mergedLogs = useMemo(() => {
    const combined = streamedLogs.length === 0
      ? fetchedLogs
      : (() => {
        const map = new Map<string, ActivityLogItem>();
        for (const log of streamedLogs) {
          map.set(log.id, log);
        }
        for (const log of fetchedLogs) {
          if (!map.has(log.id)) {
            map.set(log.id, log);
          }
        }
        return Array.from(map.values());
      })();

    const filtered = filterActivityLogs(combined, methodFilter, statusFilter, debouncedSearch);
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [streamedLogs, fetchedLogs, methodFilter, statusFilter, debouncedSearch]);

  const handleRowClick = useCallback((row: Row<ActivityLogItem>) => {
    setSelectedLog(row.original);
    setDetailOpen(true);
  }, []);

  const columns = useMemo(() => [
    columnHelper.accessor('createdAt', {
      header: t('activityLogs.columns.timestamp'),
      size: 170,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleTimeString(dateLocale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
          })}
        </span>
      ),
    }),
    columnHelper.accessor('method', {
      header: t('activityLogs.columns.method'),
      size: 90,
      cell: ({ getValue }) => {
        const method = getValue();
        return (
          <span className={`
            inline-block rounded-sm px-2 py-0.5 text-xs font-mono font-bold
            ${getMethodClass(method)}
          `}
          >
            {method}
          </span>
        );
      },
    }),
    columnHelper.accessor('statusCode', {
      header: t('activityLogs.columns.status'),
      size: 90,
      cell: ({ getValue }) => {
        const status = getValue();
        const isOk = status >= 200 && status < 400;
        return (
          <span className={`
            font-mono text-xs font-semibold
            ${isOk
            ? `text-emerald-500`
            : `text-rose-500`}
          `}
          >
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor('url', {
      header: t('activityLogs.columns.url'),
      size: 320,
      cell: ({ row }) => (
        <span className="truncate font-mono text-xs font-medium text-foreground">
          {row.original.url}
        </span>
      ),
    }),
    columnHelper.accessor('duration', {
      header: t('activityLogs.columns.duration'),
      size: 100,
      cell: ({ getValue }) => {
        const duration = getValue();
        const isSlow = duration > 500;
        return (
          <span className={`
            font-mono text-xs
            ${isSlow
            ? `text-amber-500 font-semibold`
            : `text-muted-foreground`}
          `}
          >
            {duration}
            {' '}
            ms
          </span>
        );
      },
    }),
    columnHelper.accessor('ip', {
      header: t('activityLogs.columns.ip'),
      size: 130,
      cell: ({ getValue }) => (
        <span className="font-mono text-2xs text-muted-foreground">
          {getValue() || '-'}
        </span>
      ),
    }),
    columnHelper.accessor('emailHash', {
      header: t('activityLogs.columns.user'),
      size: 120,
      cell: ({ getValue }) => {
        const hash = getValue();
        return hash
          ? (
            <span
              className="font-mono text-2xs text-muted-foreground"
              title={hash}
            >
              {hash.slice(0, 8)}
              ...
            </span>
          )
          : (
            <span className="text-2xs text-muted-foreground/40">-</span>
          );
      },
    }),
    columnHelper.accessor('id', {
      header: t('activityLogs.columns.actions'),
      size: 80,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-2xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(row.original);
            setDetailOpen(true);
          }}
        >
          {t('activityLogs.columns.detail')}
        </Button>
      ),
    }),
  ], [dateLocale, t]);

  const table = useDataGrid({
    client: false,
    cursor: true,
    data: mergedLogs,
    columns,
    enableRowSelection: false,
    initialSorting: [{ id: 'createdAt', desc: true }],
    getRowId: (row) => row.id,
  });

  const handleRefresh = () => {
    void refetch();
    void refetchStats();
  };

  const stats = statsData ?? initialStats;

  const loadMore = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    return fetchNextPage().then(() => undefined);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      {/* Header */}
      <div className="
        flex flex-wrap items-center justify-between gap-4 border-b pb-4
      "
      >
        <div>
          <h1 className="
            flex items-center gap-2 text-2xl font-bold tracking-tight
          "
          >
            <Activity className="size-6 text-primary" />
            {t('activityLogs.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('activityLogs.description')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* 실시간 수신 상태 토글 */}
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5 items-center justify-center">
              {isLive && (
                <span className="
                  absolute inline-flex size-full animate-ping rounded-full
                  bg-emerald-400 opacity-75
                "
                />
              )}
              <span className={`
                relative inline-flex size-2 rounded-full
                ${isLive ? 'bg-emerald-500' : 'bg-muted-foreground/50'}
              `}
              />
            </span>
            <span className="text-xs font-medium">
              {isLive ? t('activityLogs.liveStreaming') : t('activityLogs.paused')}
            </span>
            <Switch
              checked={isLive}
              onCheckedChange={setIsLive}
              aria-label={t('activityLogs.toggleStream')}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-1 text-xs"
          >
            <RefreshCw className={`
              size-3.5
              ${isFetching ? 'animate-spin' : ''}
            `}
            />
            {t('activityLogs.refresh')}
          </Button>
        </div>
      </div>

      {/* 실시간 통계 메트릭 카드 */}
      <div className="
        grid grid-cols-2 gap-4
        md:grid-cols-4
      "
      >
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('activityLogs.totalRequests')}</span>
            <Zap className="size-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('activityLogs.last24h')}</span>
            <Clock className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.last24hCount.toLocaleString()}</p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('activityLogs.errorRate')}</span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            <span className={stats.errorRate > 5
              ? 'text-rose-500'
              : `text-foreground`}
            >
              {stats.errorRate}
              %
            </span>
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t('activityLogs.avgDuration')}</span>
            <CheckCircle2 className="size-4 text-cyan-500" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono">
            {stats.avgDuration}
            {' '}
            <span className="text-xs font-normal text-muted-foreground">ms</span>
          </p>
        </Card>
      </div>

      {/* 필터 및 검색 툴바 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="
              absolute top-2.5 left-2.5 size-4 text-muted-foreground
            "
            />
            <Input
              placeholder={t('activityLogs.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>

          <Select value={methodFilter} onValueChange={(val) => setMethodFilter(val ?? 'ALL')}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue>
                {t(`activityLogs.filters.methods.${methodFilter}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const).map((method) => (
                <SelectItem key={method} value={method}>
                  {t(`activityLogs.filters.methods.${method}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? 'ALL')}>
            <SelectTrigger className="h-9 w-[150px] text-xs">
              <SelectValue>
                {t(`activityLogs.filters.statuses.${statusFilter}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(['ALL', '200', '201', '400', '401', '403', '404', '500'] as const).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`activityLogs.filters.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* DataGrid 로그 목록 테이블 및 스크롤 끝 도달 시 자동 추가 로드 */}
      <Card className="
        grid min-h-0 flex-1 grid-rows-[1fr_auto] overflow-hidden border
        shadow-xs
      "
      >
        <div className="min-h-0 size-full">
          <DataGrid
            table={table}
            hasMore={hasNextPage}
            onScrollEnd={loadMore}
            onRowClick={handleRowClick}
          />
        </div>

        {/* 커서 기반 무한 로드 상태 바 */}
        <div className="
          flex items-center justify-between border-t bg-muted/20 px-4 py-2
          text-xs
        "
        >
          <span className="text-muted-foreground">
            {t('activityLogs.loadedCount', { count: mergedLogs.length })}
          </span>

          {isFetchingNextPage && (
            <span className="
              flex items-center gap-1.5 text-xs text-muted-foreground
            "
            >
              <Loader2 className="size-3.5 animate-spin text-primary" />
              {t('activityLogs.loadingMore')}
            </span>
          )}

          {!hasNextPage && mergedLogs.length > 0 && !isFetchingNextPage && (
            <span className="text-2xs text-muted-foreground/60">
              {t('activityLogs.allLogsLoaded')}
            </span>
          )}
        </div>
      </Card>

      {/* 단건 로그 상세 보기 다이얼로그 */}
      <ActivityLogDetailDialog
        log={selectedLog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
