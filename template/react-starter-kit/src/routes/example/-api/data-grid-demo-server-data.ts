import { type ColumnFiltersState, type PaginationState, type SortingState } from '@tanstack/react-table';

import { type DataGridDemoRow, dataGridDemoRows } from './data-grid-demo-data';

export type { DataGridDemoRow };

export type DataGridDemoPage = {
  rows: DataGridDemoRow[]
  rowCount: number
};

export type DataGridDemoQuery = {
  pagination: PaginationState
  globalFilter: string
  columnFilters: ColumnFiltersState
  sorting: SortingState
};

export type DataGridDemoCursorQuery = Omit<DataGridDemoQuery, 'pagination'> & {
  after?: string | null
  pageSize: number
};

export type DataGridDemoCursorPage = {
  rows: DataGridDemoRow[]
  nextCursor: string | null
};

/** Simulates a server request that filters, sorts, and returns one page. */
export function fetchDataGridDemoPage({ pagination: { pageIndex, pageSize }, globalFilter, columnFilters, sorting }: DataGridDemoQuery): Promise<DataGridDemoPage> {
  const rows = getFilteredAndSortedRows({ globalFilter, columnFilters, sorting });
  const start = pageIndex * pageSize;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        rows: rows.slice(start, start + pageSize),
        rowCount: rows.length,
      });
    }, 1000);
  });
}

/** Simulates a server cursor request. The `after` row is excluded from the result. */
export function fetchDataGridDemoCursorPage({ after, pageSize, globalFilter, columnFilters, sorting }: DataGridDemoCursorQuery): Promise<DataGridDemoCursorPage> {
  const rows = getFilteredAndSortedRows({ globalFilter, columnFilters, sorting });
  const cursorIndex = after ? rows.findIndex((row) => row.id === after) : -1;
  const start = after ? cursorIndex + 1 : 0;
  const pageRows = cursorIndex === -1 && after ? [] : rows.slice(start, start + pageSize);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        rows: pageRows,
        nextCursor: pageRows.at(-1)?.id ?? after ?? null,
      });
    }, 1000);
  });
}

function getFilteredAndSortedRows({ globalFilter, columnFilters, sorting }: Omit<DataGridDemoQuery, 'pagination'>) {
  const keyword = globalFilter.trim().toLowerCase();
  const filteredRows = dataGridDemoRows.filter((row) => {
    const matchesGlobalFilter = !keyword || Object.values(row).some((value) => String(value).toLowerCase().includes(keyword));
    return matchesGlobalFilter && columnFilters.every((filter) => matchesColumnFilter(row, filter));
  });

  return [...filteredRows].sort((left, right) => compareRows(left, right, sorting));
}

function matchesColumnFilter(row: DataGridDemoRow, { id, value }: ColumnFiltersState[number]) {
  const cell = row[id as keyof DataGridDemoRow];
  if (value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.every((item) => typeof item === 'string') && value.includes(cell);
  if (typeof value !== 'string') return true;
  return cell.toLowerCase().includes(value.toLowerCase());
}

function compareRows(left: DataGridDemoRow, right: DataGridDemoRow, sorting: SortingState) {
  for (const { id, desc } of sorting) {
    const leftValue = left[id as keyof DataGridDemoRow];
    const rightValue = right[id as keyof DataGridDemoRow];

    const result = leftValue.localeCompare(rightValue, undefined, { numeric: true });
    if (result !== 0) return desc ? -result : result;
  }

  return 0;
}
