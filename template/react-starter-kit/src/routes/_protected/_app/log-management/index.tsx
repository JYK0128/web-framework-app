import { jsonSafeParse, valueIf } from '@pkg/shared/common';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import type { ColumnFiltersState, Row } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GetLogsResponseDto, LogItemDto, LogStatsResponseDto } from '#/.generated/api/model';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { openDialog } from '#/components/dialog';
import { PageSection, SectionCard } from '#/components/layout';
import { hasPermission } from '#/core/auth/permissions';
import { axios } from '#/core/config/axios';
import { useI18n } from '#/hooks';

import { LogDetailDialog } from './-components/log-detail-dialog';
import { LogStatsCards } from './-components/log-stats-cards';
import { getTimeRangeMs, initialStats, TIME_RANGE_OPTIONS, type TimeRangeOption } from './-configs/log.config';
import { createLogColumns } from './-configs/log-columns.config';

export const Route = createFileRoute('/_protected/_app/log-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'log:manage')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: LogsPage,
});

function LogsPage() {
  const { i18n, t } = useI18n();

  const [isLive, setIsLive] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('24h');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const selectedMethods = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === 'method');
    if (!filter) return [];
    return Array.isArray(filter.value) ? (filter.value as string[]) : [String(filter.value)];
  }, [columnFilters]);

  const selectedStatuses = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === 'statusCode');
    if (!filter) return [];
    return Array.isArray(filter.value) ? (filter.value as string[]) : [String(filter.value)];
  }, [columnFilters]);

  const handleSelectLog = useCallback((log: LogItemDto) => {
    void openDialog(LogDetailDialog, { log }, { dialogId: `log-${log.id}` });
  }, []);

  const filterKey = `${selectedMethods.join(',')}:${selectedStatuses.join(',')}:${searchKeyword}`;

  // 실시간 스트림 수신 로그 상태
  const [streamedState, setStreamedState] = useState<{ filterKey: string, logs: LogItemDto[] }>({
    filterKey: '',
    logs: [],
  });

  const streamedLogs = useMemo(
    () => streamedState.filterKey === filterKey ? streamedState.logs : [],
    [streamedState.filterKey, streamedState.logs, filterKey],
  );

  const appendStreamedLog = useCallback((newLog: LogItemDto) => {
    if (selectedMethods.length > 0 && !selectedMethods.includes(newLog.method)) return;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(String(newLog.statusCode))) return;
    if (searchKeyword.trim()) {
      const lower = searchKeyword.trim().toLowerCase();
      const matches = (newLog.url?.toLowerCase().includes(lower))
        || (newLog.method?.toLowerCase().includes(lower))
        || (String(newLog.statusCode).includes(lower))
        || (newLog.requestId?.toLowerCase().includes(lower));
      if (!matches) return;
    }
    setStreamedState((prev) => {
      const baseLogs = prev.filterKey === filterKey ? prev.logs : [];
      if (baseLogs.some((log) => log.id === newLog.id)) return prev;
      return {
        filterKey,
        logs: [newLog, ...baseLogs],
      };
    });
  }, [filterKey, selectedMethods, selectedStatuses, searchKeyword]);

  // REST API 커서 기반 무한 로그 쿼리 (시간 제한 없이 과거로 무한 스크롤)
  const {
    data: infiniteLogsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['logs', { selectedMethods, selectedStatuses, searchKeyword }],
    queryFn: ({ pageParam }) => {
      const params: Record<string, unknown> = {
        limit: 30,
        cursor: pageParam || undefined,
      };
      if (selectedMethods.length > 0) {
        params.method = selectedMethods.join(',');
      }
      if (selectedStatuses.length > 0) {
        params.statusCode = selectedStatuses.join(',');
      }
      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }

      return axios<GetLogsResponseDto>({
        url: '/api/v1/logs',
        method: 'GET',
        params,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => valueIf(lastPage?.hasNextPage ?? false, lastPage.endCursor),
  });

  // 통계 요약 쿼리 (선택된 시간 범위 반영)
  const {
    data: statsData,
    isPending: isStatsPending,
    isFetching: isStatsFetching,
  } = useQuery({
    queryKey: ['logs-stats', timeRange],
    queryFn: () => {
      const now = Date.now();
      const startDate = new Date(now - getTimeRangeMs(timeRange)).toISOString();

      return axios<LogStatsResponseDto>({
        url: '/api/v1/logs/stats',
        method: 'GET',
        params: { startDate },
      });
    },
  });

  const isStatsLoading = isStatsPending || isStatsFetching;

  // 실시간 SSE 스트리밍
  useEffect(() => {
    if (!isLive) return;

    const eventSource = new EventSource('/api/v1/logs/stream');

    const handleMessage = (event: MessageEvent<string>) => {
      const newLog = jsonSafeParse<LogItemDto>(event.data);
      if (!newLog?.id || !newLog.method) return;
      appendStreamedLog(newLog);
    };

    eventSource.addEventListener('log', handleMessage);
    eventSource.onmessage = handleMessage;

    return () => {
      eventSource.removeEventListener('log', handleMessage);
      eventSource.onmessage = null;
      eventSource.close();
    };
  }, [appendStreamedLog, isLive]);

  // 무한 쿼리 페이지들을 1차원 배열로 평탄화
  const fetchedLogs = useMemo(() => {
    const pages = infiniteLogsData?.pages ?? [];
    const allItems: LogItemDto[] = [];
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
        const map = new Map<string, LogItemDto>();
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

    return combined.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) return diff;
      return b.id.localeCompare(a.id);
    });
  }, [streamedLogs, fetchedLogs]);

  const rawTotalCount = infiniteLogsData?.pages[0]?.totalCount ?? 0;
  const effectiveTotalCount = Math.max(rawTotalCount + streamedLogs.length, mergedLogs.length);

  const columns = useMemo(
    () => createLogColumns({ i18n, onSelectLog: handleSelectLog }),
    [handleSelectLog, i18n],
  );

  const table = useDataGrid({
    client: false,
    cursor: true,
    data: mergedLogs,
    columns,
    enableRowSelection: false,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (val) => setSearchKeyword(typeof val === 'string' ? val : ''),
    initialState: {
      globalFilter: searchKeyword,
      columnFilters,
      sorting: [{ id: 'createdAt', desc: true }],
    },
    getRowId: (row) => row.id,
  });

  const handleRowClick = useCallback((row: Row<LogItemDto>) => {
    handleSelectLog(row.original);
  }, [handleSelectLog]);

  const stats = statsData ?? initialStats;

  const loadMore = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    return fetchNextPage().then(() => undefined);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <PageSection icon="activity" title={t('logManagement.title')} description={t('logManagement.description')}>
      <PageSection.Actions>
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
            {isLive ? t('logManagement.liveStreaming') : t('logManagement.paused')}
          </span>
          <Switch
            checked={isLive}
            onCheckedChange={setIsLive}
            aria-label={t('logManagement.toggleStream')}
          />
        </div>
      </PageSection.Actions>
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <div className="grid grid-rows-[auto_1fr] gap-6">
          {/* 통계 섹션 카드 */}
          <SectionCard
            icon="chart-no-axes-combined"
            title={t('logManagement.statsTitle')}
            textSize="sm"
          >
            <SectionCard.Actions>
              <div className="flex items-center gap-2">
                {isStatsLoading && (
                  <Loader2 className="
                    size-3.5 animate-spin text-muted-foreground
                  "
                  />
                )}
                <span className="text-xs text-muted-foreground">{t('logManagement.statsPeriod')}</span>
                <Select
                  items={TIME_RANGE_OPTIONS.map((r) => ({ label: t(`logManagement.filters.timeRanges.${r}`), value: r }))}
                  value={timeRange}
                  onValueChange={(val) => setTimeRange(val as TimeRangeOption)}
                >
                  <SelectTrigger className="h-8 w-[125px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGE_OPTIONS.map((range) => (
                      <SelectItem key={range} value={range}>
                        {t(`logManagement.filters.timeRanges.${range}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SectionCard.Actions>
            <SectionCard.Content className="p-4">
              <LogStatsCards stats={stats} isLoading={isStatsLoading} translate={t} />
            </SectionCard.Content>
          </SectionCard>

          {/* 로그 데이터 그리드 카드 (메소드 및 상태 필터는 표 헤더 컬럼 필터에 통합) */}
          <SectionCard textSize="sm">
            <SectionCard.Content>
              <div className="grid h-full grid-rows-[auto_1fr_auto]">
                <DataGridToolbar
                  table={table}
                  searchPlaceholder={t('logManagement.filters.searchPlaceholder')}
                  onReset={() => {
                    setColumnFilters([]);
                    setSearchKeyword('');
                    table.resetColumnFilters();
                    table.setGlobalFilter('');
                  }}
                />

                <div className="size-full">
                  <DataGrid
                    table={table}
                    hasMore={hasNextPage}
                    onScrollEnd={loadMore}
                    onRowClick={handleRowClick}
                  />
                </div>

                <div className="
                  flex items-center justify-between border-t bg-muted/20 text-xs
                  text-muted-foreground
                "
                >
                  <span>
                    {t('logManagement.loadedCount', { count: mergedLogs.length })}
                  </span>

                  <span className="flex items-center gap-3">
                    {isFetchingNextPage && (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        {t('logManagement.loadingMore')}
                      </span>
                    )}

                    {!hasNextPage && mergedLogs.length > 0 && !isFetchingNextPage && (
                      <span>
                        {t('logManagement.allLogsLoaded')}
                      </span>
                    )}

                    {effectiveTotalCount > 0 && (
                      <span>
                        {t('logManagement.totalCount', { count: effectiveTotalCount.toLocaleString() })}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </SectionCard.Content>

          </SectionCard>
        </div>
      </PageSection.Content>
    </PageSection>
  );
}
