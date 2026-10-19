import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';

import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#ui/data-grid';

type Person = { name: string, email: string, role: string };
const rows: Person[] = [
  { name: '김민준', email: 'minjun@example.com', role: '관리자' },
  { name: '이서연', email: 'seoyeon@example.com', role: '운영자' },
  { name: '박지호', email: 'jiho@example.com', role: '편집자' },
  { name: '최하은', email: 'haeun@example.com', role: '운영자' },
];
const columns: ColumnDef<Person>[] = [
  { accessorKey: 'name', header: '이름', enableSorting: true },
  { accessorKey: 'email', header: '이메일', enableSorting: true },
  { accessorKey: 'role', header: '역할', enableSorting: true },
];

function PeopleGrid() {
  const table = useDataGrid({ data: rows, columns, client: true, enableSorting: true, enableGlobalFilter: true, getRowId: (row) => row.email });
  return (
    <div className="
      grid h-[360px] grid-rows-[auto_minmax(0,1fr)_auto] rounded-md border
    "
    >
      <DataGridToolbar table={table} />
      <DataGrid table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}

const meta = { title: '웹코어/데이터 그리드/DataGrid', component: PeopleGrid, tags: ['autodocs'], parameters: { docs: { description: { component: '`useDataGrid`에 TanStack Table columns와 data를 전달하고, `DataGrid`와 툴바 및 페이지네이션을 조합합니다. `client: true`면 정렬과 필터링을 클라이언트에서 처리합니다. 서버 모드에서는 기본값을 사용하고 onPaginationChange, onSortingChange, onGlobalFilterChange로 API 쿼리를 연결하세요.' } } } } satisfies Meta<typeof PeopleGrid>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ClientSide: Story = {};
