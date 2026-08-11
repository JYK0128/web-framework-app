import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, dataGridDemoColumns, type DataGridDemoRow, dataGridDemoRowsQuery, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';

const clientTableColumns: ColumnDef<DataGridDemoRow>[] = [
  ...dataGridDemoColumns,
  {
    id: 'department',
    header: 'Department',
    accessorFn: (row) => `${row.team} Operations`,
    size: 180,
  },
  {
    id: 'location',
    header: 'Location',
    accessorFn: (row) => ['Seoul', 'Tokyo', 'Singapore', 'New York'][getMemberIndex(row) % 4],
    size: 140,
  },
  {
    id: 'joinedAt',
    header: 'Joined At',
    accessorFn: (row) => `202${getMemberIndex(row) % 5}-0${(getMemberIndex(row) % 9) + 1}-15`,
    size: 150,
  },
  {
    id: 'lastActiveAt',
    header: 'Last Active',
    accessorFn: (row) => `${(getMemberIndex(row) % 12) + 1} minutes ago`,
    size: 160,
  },
  {
    id: 'projects',
    header: 'Projects',
    accessorFn: (row) => (getMemberIndex(row) % 12) + 1,
    size: 110,
  },
  {
    id: 'plan',
    header: 'Plan',
    accessorFn: (row) => ['Starter', 'Team', 'Enterprise'][getMemberIndex(row) % 3],
    size: 140,
  },
  {
    id: 'phone',
    header: 'Phone',
    accessorFn: (row) => `010-${String(1000 + getMemberIndex(row)).slice(-4)}-${String(2000 + getMemberIndex(row)).slice(-4)}`,
    size: 170,
  },
  {
    id: 'notes',
    header: 'Notes',
    accessorFn: (row) => `Member ${getMemberIndex(row)} account`,
    size: 220,
  },
];

function getMemberIndex(row: DataGridDemoRow) {
  return Number(row.id.replace('member-', ''));
}

export const Route = createFileRoute('/example/table/client')({
  loader: ({ context }) => context.queryClient.ensureQueryData(dataGridDemoRowsQuery()),
  component: TableClientPage,
});

function TableClientPage() {
  const { data: rows = [] } = useQuery(dataGridDemoRowsQuery());
  const table = useDataGrid({
    data: rows,
    columns: clientTableColumns,
    defaultColumn: { size: 160 },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
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
          <CardTitle>Client Page DataGrid 예제</CardTitle>
          <CardDescription>
            TanStack Query가 전체 데이터를 한 번 가져오고, 테이블이 페이지네이션·검색·정렬·필터를 처리합니다.
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
          <DataTablePagination table={table} rowCount={rows.length} />
        </CardContent>
      </Card>
    </main>
  );
}
