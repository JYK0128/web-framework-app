import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // Declaration merging requires the same generic names as TanStack Table.
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterType?: 'text' | 'number' | 'date' | 'faceted'
    filterMultiple?: boolean
    filterOptions?: Array<{ label: string, value: string }>
  }
}
