import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type ColumnFiltersState, type GlobalFilterTableState, type SortingState } from '@tanstack/react-table';
import { isString } from 'lodash-es';
import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, dataGridDemoColumns, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { fetchDataGridDemoPage } from '#/routes/example/-api/data-grid-demo-server-data';

type PageSearch = {
  pageIndex: number
  pageSize: number
  globalFilter: string
  columnFilters: ColumnFiltersState
  sorting: SortingState
};

const DEFAULT_SEARCH: PageSearch = {
  pageIndex: 0,
  pageSize: 10,
  globalFilter: '',
  columnFilters: [],
  sorting: [],
};

const dataGridPageQuery = ({ pageIndex, pageSize, globalFilter, columnFilters, sorting }: PageSearch) => queryOptions({
  queryKey: ['server-data-grid-page', { pageIndex, pageSize, globalFilter, columnFilters, sorting }] as const,
  queryFn: () => fetchDataGridDemoPage({
    pagination: { pageIndex, pageSize },
    globalFilter,
    columnFilters,
    sorting,
  }),
});

export const Route = createFileRoute('/example/table/server')({
  validateSearch: (search): PageSearch => ({
    pageIndex: toNonNegativeInteger(search.pageIndex, DEFAULT_SEARCH.pageIndex),
    pageSize: toPositiveInteger(search.pageSize, DEFAULT_SEARCH.pageSize),
    globalFilter: isString(search.globalFilter) ? search.globalFilter : DEFAULT_SEARCH.globalFilter,
    columnFilters: toColumnFilters(search.columnFilters),
    sorting: toSorting(search.sorting),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    // Start the request without awaiting it. The Query integration streams the
    // resolved cache entry while this route renders its Suspense fallback.
    void context.queryClient.prefetchQuery(dataGridPageQuery(deps));
  },
  component: ServerTablePage,
});

function ServerTablePage() {
  return (
    <Suspense fallback={<ServerTableLoading />}>
      <ServerTableContent />
    </Suspense>
  );
}

function ServerTableContent() {
  const search = Route.useSearch();
  const { data: page } = useSuspenseQuery(dataGridPageQuery(search));

  return <ServerTableGrid key={JSON.stringify(search)} search={search} rows={page.rows} rowCount={page.rowCount} />;
}

function ServerTableLoading() {
  return (
    <main className="
      mx-auto flex h-dvh max-w-7xl flex-col overflow-hidden p-5
      md:p-9
    "
    >
      <Card className="flex min-h-0 flex-1 flex-col shadow-sm">
        <CardHeader>
          <CardTitle>TanStack Query SSR DataGrid 예제</CardTitle>
          <CardDescription>서버에서 데이터를 가져오는 중입니다.</CardDescription>
        </CardHeader>
        <CardContent className="
          flex min-h-0 flex-1 flex-col gap-px overflow-hidden p-0
        "
        >
          <Skeleton className="h-10 rounded-none" />
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-10 shrink-0 rounded-none" />
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

function ServerTableGrid({ search, rows, rowCount }: {
  search: PageSearch
  rows: Awaited<ReturnType<typeof fetchDataGridDemoPage>>['rows']
  rowCount: number
}) {
  const navigate = Route.useNavigate();
  const table = useDataGrid({
    client: false,
    data: rows,
    columns: dataGridDemoColumns,
    rowCount,
    defaultColumn: { size: 160 },
    initialState: {
      pagination: { pageIndex: search.pageIndex, pageSize: search.pageSize },
      globalFilter: search.globalFilter,
      columnFilters: search.columnFilters,
      sorting: search.sorting,
    },
    getRowId: (row) => row.id,
    onPaginationChange: (nextPagination) => {
      void navigate({
        search: {
          pageIndex: nextPagination.pageIndex,
          pageSize: nextPagination.pageSize,
          globalFilter: search.globalFilter,
          columnFilters: search.columnFilters,
          sorting: search.sorting,
        },
      });
    },
    onGlobalFilterChange: (globalFilter) => {
      void navigate({
        search: {
          ...search,
          pageIndex: 0,
          globalFilter: toGlobalFilter(globalFilter),
        },
      });
    },
    onColumnFiltersChange: (columnFilters) => {
      void navigate({
        search: { ...search, pageIndex: 0, columnFilters },
      });
    },
    onSortingChange: (sorting) => {
      void navigate({
        search: { ...search, pageIndex: 0, sorting },
      });
    },
  });

  return (
    <main className="
      mx-auto flex h-dvh max-w-7xl flex-col overflow-hidden p-5
      md:p-9
    "
    >
      <Card className="flex min-h-0 flex-1 flex-col shadow-sm">
        <CardHeader>
          <CardTitle>TanStack Query SSR DataGrid 예제</CardTitle>
          <CardDescription>
            route loader가 첫 페이지를 서버에서 prefetch하고, hydration 뒤에는 Query 캐시를 재사용합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="
          flex min-h-0 flex-1 flex-col overflow-hidden p-0
        "
        >
          <DataGridToolbar table={table} />
          <div className="min-h-0 flex-1">
            <DataGrid table={table} />
          </div>
          <DataTablePagination table={table} rowCount={rowCount} />
        </CardContent>
      </Card>
    </main>
  );
}

function toGlobalFilter(value: GlobalFilterTableState['globalFilter']) {
  return isString(value) ? value : '';
}

function toColumnFilters(value: unknown): ColumnFiltersState {
  if (!Array.isArray(value)) return [];

  return value.flatMap((filter) => {
    if (!isRecord(filter) || !isString(filter.id)) return [];
    return [{ id: filter.id, value: filter.value }];
  });
}

function toSorting(value: unknown): SortingState {
  if (!Array.isArray(value)) return [];

  return value.flatMap((sort) => {
    if (!isRecord(sort) || !isString(sort.id) || typeof sort.desc !== 'boolean') return [];
    return [{ id: sort.id, desc: sort.desc }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNonNegativeInteger(value: unknown, fallback: number) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function toPositiveInteger(value: unknown, fallback: number) {
  const number = toNonNegativeInteger(value, fallback);
  return number > 0 ? number : fallback;
}
