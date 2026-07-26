import { queryOptions } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';

import { getDataGridToolColumn } from '#/components/data-grid/data-grid-tool-column';

export type DataGridDemoRow = {
  id: string
  name: string
  email: string
  team: string
  role: string
  status: 'Active' | 'Review' | 'Inactive'
};

/** Shared rows for the pagination and cursor-based DataGrid examples. */
export const dataGridDemoRows: DataGridDemoRow[] = Array.from({ length: 83 }, (_, index) => ({
  id: `member-${index + 1}`,
  name: `Member ${index + 1}`,
  email: `member${index + 1}@example.com`,
  team: ['Platform', 'Design', 'Growth'][index % 3],
  role: ['Engineer', 'Designer', 'Manager'][index % 3],
  status: ['Active', 'Review', 'Inactive'][index % 3] as DataGridDemoRow['status'],
}));

/** Simulates fetching the complete client-side dataset once. */
export function fetchDataGridDemoRows(): Promise<DataGridDemoRow[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(dataGridDemoRows), 1000);
  });
}

export const dataGridDemoRowsQuery = () => queryOptions({
  queryKey: ['client-data-grid-demo-rows'],
  queryFn: fetchDataGridDemoRows,
  staleTime: 5 * 60 * 1000,
});

export const dataGridDemoColumns: ColumnDef<DataGridDemoRow>[] = [
  getDataGridToolColumn(),
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'team', header: 'Team' },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterType: 'faceted',
      filterOptions: [
        { label: 'Active', value: 'Active' },
        { label: 'Review', value: 'Review' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
  },
];
