import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type ColumnFiltersState, type SortingState } from '@tanstack/react-table';
import { isString } from 'lodash-es';
import { useCallback } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, dataGridDemoColumns, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { type DataGridDemoRow, fetchDataGridDemoCursorPage } from '#/routes/example/-api/data-grid-demo-server-data';

const PAGE_SIZE = 20;
const EMPTY_ROWS: DataGridDemoRow[] = [];
const INITIAL_CURSOR_QUERY = {
  globalFilter: '',
  columnFilters: [] as ColumnFiltersState,
  sorting: [] as SortingState,
};

function dataGridCursorQuery({ globalFilter, columnFilters, sorting }: typeof INITIAL_CURSOR_QUERY) {
  return infiniteQueryOptions({
    queryKey: ['server-data-grid-cursor', { globalFilter, columnFilters, sorting }] as const,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchDataGridDemoCursorPage({
      after: pageParam,
      pageSize: PAGE_SIZE,
      globalFilter,
      columnFilters,
      sorting,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export const Route = createFileRoute('/example/list/server')({
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(dataGridCursorQuery(INITIAL_CURSOR_QUERY)),
  component: ServerListPage,
});

function ServerListPage() {
  const table = useDataGrid({
    client: false,
    cursor: true,
    data: EMPTY_ROWS,
    columns: dataGridDemoColumns,
    defaultColumn: { size: 160 },
    getRowId: (row) => row.id,
  });
  const tableState = table.getState();
  const globalFilter = isString(tableState.globalFilter) ? tableState.globalFilter : '';
  const query = dataGridCursorQuery({
    globalFilter,
    columnFilters: tableState.columnFilters,
    sorting: tableState.sorting,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(query);
  const rows = data?.pages.flatMap((page) => page.rows) ?? EMPTY_ROWS;
  const loadMore = useCallback(() => {
    if (isFetchingNextPage) return;
    return fetchNextPage().then(() => undefined);
  }, [fetchNextPage, isFetchingNextPage]);

  // DataGrid owns its table state. Query owns cursor pages, so inject the
  // flattened query result after both hooks have produced their state.
  table.setOptions((options) => ({ ...options, data: rows }));

  return (
    <main className="
      mx-auto flex h-dvh max-w-7xl flex-col overflow-hidden p-5
      md:p-9
    "
    >
      <Card className="flex min-h-0 flex-1 flex-col shadow-sm">
        <CardHeader>
          <CardTitle>Server Cursor DataGrid 예제</CardTitle>
          <CardDescription>
            loader가 첫 cursor 페이지를 준비하고, 검색·컬럼 필터·정렬 및 다음 페이지 요청은 TanStack Query가 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="
          flex min-h-0 flex-1 flex-col overflow-hidden p-0
        "
        >
          <DataGridToolbar table={table} />
          <div className="min-h-0 flex-1">
            <DataGrid
              table={table}
              hasMore={hasNextPage}
              onScrollEnd={loadMore}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
