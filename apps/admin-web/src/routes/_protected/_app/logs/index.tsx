import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type ColumnFiltersState, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { getLogsControllerGetLogsV1QueryKey, useLogsControllerGetLogsV1, useLogsControllerGetStatsV1 } from '#/.generated/api/endpoints/logs/logs';
import type { LogsControllerGetLogsV1Params } from '#/.generated/api/model';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard, StatsCard } from '#/components/layout';

export const Route = createFileRoute('/_protected/_app/logs/')({ component: LogsPage });

type LogRow = { id: string, createdAt: string, level: string, method: string, path: string, statusCode: number, durationMs: number, requestId: string | null };
type LogResponse = { items: LogRow[], page: number, totalPages: number, totalCount: number };
const column = createColumnHelper<LogRow>();

function LogsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting] = useState<SortingState>([]);
  const selectedStatus = columnFilters.find((filter) => filter.id === 'statusCode')?.value;
  const status = Array.isArray(selectedStatus) && selectedStatus.length === 1 ? String(selectedStatus[0]) : undefined;
  const params: LogsControllerGetLogsV1Params = { page, limit: 20, search: search.trim() || undefined, status };
  const logsQuery = useLogsControllerGetLogsV1(params);
  const statsQuery = useLogsControllerGetStatsV1();
  const response = logsQuery.data?.data as LogResponse | undefined;
  const stats = statsQuery.data?.data;
  const columns = useMemo(() => [
    column.accessor('createdAt', {
      header: '시간',
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleString('ko-KR')}
        </span>
      ),
    }),
    column.accessor('level', {
      header: '등급',
      cell: ({ getValue }) => (
        <span className={logLevelClass(getValue())}>
          {getValue()}
        </span>
      ),
    }),
    column.accessor('method', { header: '메서드' }),
    column.accessor('path', { header: '요청 경로' }),
    column.accessor('statusCode', {
      header: '상태',
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterOptions: [
          { label: '정상', value: 'success' },
          { label: '오류', value: 'error' },
        ],
        filterMultiple: false,
      },
      filterFn: (row, id, value) => {
        if (!Array.isArray(value) || value.length === 0) return true;
        const statusCode = row.getValue<number>(id);
        return value[0] === 'success' ? statusCode < 400 : statusCode >= 400;
      },
      cell: ({ getValue }) => (
        <span className={getValue() >= 400
          ? `font-semibold text-destructive`
          : `text-emerald-600`}
        >
          {getValue()}
        </span>
      ),
    }),
    column.accessor('durationMs', { header: '소요 시간', cell: ({ getValue }) => `${getValue()}ms` }),
    column.accessor('requestId', {
      header: 'Request ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {getValue() ?? '-'}
        </span>
      ),
    }),
  ], []);
  const table = useDataGrid({
    client: false,
    data: response?.items ?? [],
    columns,
    pageCount: response?.totalPages ?? 1,
    initialState: { pagination: { pageIndex: page - 1, pageSize: 20 }, sorting },
    onPaginationChange: ({ pageIndex }) => setPage(pageIndex + 1),
    onColumnFiltersChange: (value) => {
      setPage(1);
      setColumnFilters(value);
    },
    onGlobalFilterChange: (value) => {
      setPage(1);
      setSearch(typeof value === 'string' ? value : '');
    },
  });

  return (
    <PageSection icon="activity" title="로그 관리" description="관리자 API 요청의 결과와 처리 시간을 확인합니다.">
      <PageSection.Content className="
        scroll-y grid grid-rows-[auto_minmax(0,1fr)] gap-4 p-2
      "
      >
        <div className="
          grid gap-3
          sm:grid-cols-4
        "
        >
          <StatsCard label="전체 요청" value={stats?.total ?? 0} icon="zap" iconColor="text-blue-500" isLoading={statsQuery.isLoading} />
          <StatsCard label="오류 요청" value={stats?.errors ?? 0} icon="x-circle" iconColor="text-rose-500" textColor={stats && stats.errors > 0 ? 'text-rose-500' : undefined} isLoading={statsQuery.isLoading} />
          <StatsCard label="오류율" value={`${stats?.errorRate ?? 0}%`} icon="triangle-alert" iconColor="text-amber-500" textColor={stats && stats.errorRate > 5 ? 'text-rose-500' : undefined} isLoading={statsQuery.isLoading} />
          <StatsCard label="평균 응답" value={`${stats?.averageDurationMs ?? 0}ms`} icon="check-circle-2" iconColor="text-emerald-500" isLoading={statsQuery.isLoading} />
        </div>
        <SectionCard textSize="sm" title="요청 로그" description="최근 요청부터 표시됩니다.">
          <SectionCard.Content className="
            grid h-full grid-rows-[auto_minmax(0,1fr)_auto]
          "
          >
            <DataGridToolbar
              table={table}
              searchPlaceholder="경로 또는 Request ID 검색..."
              onReset={() => {
                setPage(1);
                setSearch('');
                setColumnFilters([]);
                void queryClient.invalidateQueries({ queryKey: getLogsControllerGetLogsV1QueryKey(params) });
              }}
            />
            <DataGrid table={table} />
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}

function logLevelClass(level: string) {
  if (level === 'error') return 'font-semibold text-destructive';
  if (level === 'warn') return 'font-semibold text-amber-600';
  return 'text-muted-foreground';
}
