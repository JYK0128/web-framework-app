import { jsonSafeParse } from '@pkg/shared/common';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import type { Row } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ActivityLogItemDto, ActivityStatsResponseDto, GetActivityLogsResponseDto } from '#/.generated/api/model';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/app';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { axios } from '#/core/config/axios';
import { useI18n } from '#/hooks';

import { ActivityLogDetailDialog } from './-components/activity-log-detail-dialog';
import { ActivityStatsCards } from './-components/activity-stats-cards';
import { initialStats, METHOD_OPTIONS, STATUS_OPTIONS } from './-configs/activity-log.config';
import { createActivityLogColumns } from './-configs/activity-log-columns.config';

export const Route = createFileRoute('/_protected/_app/log-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'activityLog:manage')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  const { i18n, t } = useI18n();

  const [isLive, setIsLive] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItemDto | null>(null);

  // 실시간 스트림 수신 로그 상태
  const [streamedLogs, setStreamedLogs] = useState<ActivityLogItemDto[]>([]);

  const appendStreamedLog = useCallback((newLog: ActivityLogItemDto) => {
    setStreamedLogs((logs) => {
      if (logs.some((log) => log.id === newLog.id)) return logs;
      return [newLog, ...logs];
    });
  }, []);

  // REST API 무한 커서 기반 로그 쿼리
  const {
    data: infiniteLogsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['activity-logs'],
    queryFn: ({ pageParam }) => axios<GetActivityLogsResponseDto>({
      url: '/api/v1/activity-logs',
      method: 'GET',
      params: {
        limit: 30,
        cursor: pageParam || undefined,
      },
    }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage?.hasNextPage ? lastPage.endCursor : undefined),
  });

  // 통계 요약 쿼리
  const { data: statsData } = useQuery({
    queryKey: ['activity-logs-stats'],
    queryFn: () => axios<ActivityStatsResponseDto>({
      url: '/api/v1/activity-logs/stats',
      method: 'GET',
    }),
    initialData: initialStats,
  });

  // 실시간 SSE 스트리밍
  useEffect(() => {
    if (!isLive) return;

    const eventSource = new EventSource('/api/v1/activity-logs/stream');

    const handleMessage = (event: MessageEvent<string>) => {
      const newLog = jsonSafeParse<ActivityLogItemDto>(event.data);
      if (!newLog?.id || !newLog.method) return;
      appendStreamedLog(newLog);
    };

    eventSource.addEventListener('activity-log', handleMessage);
    eventSource.onmessage = handleMessage;

    return () => {
      eventSource.removeEventListener('activity-log', handleMessage);
      eventSource.onmessage = null;
      eventSource.close();
    };
  }, [appendStreamedLog, isLive]);

  // 무한 쿼리 페이지들을 1차원 배열로 평탄화
  const fetchedLogs = useMemo(() => {
    const pages = infiniteLogsData?.pages ?? [];
    const allItems: ActivityLogItemDto[] = [];
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
        const map = new Map<string, ActivityLogItemDto>();
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

    return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [streamedLogs, fetchedLogs]);

  const rawTotalCount = infiniteLogsData?.pages[0]?.totalCount ?? 0;
  const effectiveTotalCount = Math.max(rawTotalCount + streamedLogs.length, mergedLogs.length);

  const columns = useMemo(
    () => createActivityLogColumns({ i18n, onSelectLog: setSelectedLog }),
    [i18n],
  );

  const table = useDataGrid({
    client: true,
    cursor: true,
    data: mergedLogs,
    columns,
    enableRowSelection: false,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
    },
    getRowId: (row) => row.id,
  });

  const handleRowClick = useCallback((row: Row<ActivityLogItemDto>) => {
    setSelectedLog(row.original);
  }, []);

  const methodFilter = (table.getState().columnFilters.find((filter) => filter.id === 'method')?.value as string) ?? 'ALL';
  const statusFilter = (table.getState().columnFilters.find((filter) => filter.id === 'statusCode')?.value as string) ?? 'ALL';

  const stats = statsData ?? initialStats;

  const loadMore = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    return fetchNextPage().then(() => undefined);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <PageSection icon="activity" title={t('activityLogs.title')} description={t('activityLogs.description')}>
      <PageSection.Actions>
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
        </div>
      </PageSection.Actions>
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <div className="grid grid-rows-[auto_auto_1fr] gap-6">
          <ActivityStatsCards stats={stats} translate={t} />
          {/* 별도 필터 바 (HTTP Method, Status Code) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              items={METHOD_OPTIONS.map((m) => ({ label: t(`activityLogs.filters.methods.${m}`), value: m }))}
              value={methodFilter}
              onValueChange={(val) => {
                table.getColumn('method')?.setFilterValue(val === 'ALL' ? undefined : val);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {t(`activityLogs.filters.methods.${method}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              items={STATUS_OPTIONS.map((s) => ({ label: t(`activityLogs.filters.statuses.${s}`), value: s }))}
              value={statusFilter}
              onValueChange={(val) => {
                table.getColumn('statusCode')?.setFilterValue(val === 'ALL' ? undefined : val);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`activityLogs.filters.statuses.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SectionCard textSize="sm">
            <SectionCard.Content>
              <div className="grid h-full grid-rows-[auto_1fr_auto]">
                <DataGridToolbar
                  table={table}
                  searchPlaceholder={t('activityLogs.filters.searchPlaceholder')}
                  onReset={() => {
                    table.setGlobalFilter('');
                    table.setColumnFilters([]);
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
                    {t('activityLogs.loadedCount', { count: mergedLogs.length })}
                  </span>

                  <span className="flex items-center gap-3">
                    {isFetchingNextPage && (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        {t('activityLogs.loadingMore')}
                      </span>
                    )}

                    {!hasNextPage && mergedLogs.length > 0 && !isFetchingNextPage && (
                      <span>
                        {t('activityLogs.allLogsLoaded')}
                      </span>
                    )}

                    {effectiveTotalCount > 0 && (
                      <span>
                        {t('activityLogs.totalCount', { count: effectiveTotalCount.toLocaleString() })}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </SectionCard.Content>

          </SectionCard>
        </div>
      </PageSection.Content>

      <PageSection.Dialogs>
        {selectedLog && (
          <ActivityLogDetailDialog
            key={selectedLog.id}
            log={selectedLog}
          />
        )}
      </PageSection.Dialogs>
    </PageSection>
  );
}
