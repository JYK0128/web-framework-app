import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, dataGridDemoColumns, dataGridDemoRowsQuery, DataGridToolbar, useDataGrid } from '#/components/data-grid';

export const Route = createFileRoute('/example/list/client')({
  loader: ({ context }) => context.queryClient.ensureQueryData(dataGridDemoRowsQuery()),
  component: ListClientPage,
});

function ListClientPage() {
  const { data: rows = [] } = useQuery(dataGridDemoRowsQuery());
  const table = useDataGrid({
    cursor: true,
    data: rows,
    columns: dataGridDemoColumns,
    defaultColumn: { size: 160 },
    initialState: {},
    getRowId: (row) => row.id,
  });

  return (
    <main className="
      mx-auto flex h-dvh max-w-7xl flex-col overflow-hidden p-5
      md:p-9
    "
    >
      <Card className="flex min-h-0 flex-1 flex-col shadow-sm">
        <CardHeader>
          <CardTitle>Client Cursor DataGrid 예제</CardTitle>
          <CardDescription>
            TanStack Query가 전체 데이터를 한 번 가져오고, 테이블이 검색·정렬·필터를 처리합니다.
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
        </CardContent>
      </Card>
    </main>
  );
}
