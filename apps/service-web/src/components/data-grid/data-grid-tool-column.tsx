import { type ColumnDef, type Row, type Table } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Pin } from 'lucide-react';

import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

export function getDataGridToolColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'tools',
    size: 100,
    minSize: 100,
    maxSize: 100,
    header: ({ table }) => <DataGridToolHeader table={table} />,
    cell: ({ row }) => <DataGridToolCell row={row} />,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    enablePinning: false,
  };
}

function DataGridToolHeader<TData>({ table }: { table: Table<TData> }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="전체 선택" />
    </div>
  );
}

function DataGridToolCell<TData>({ row }: { row: Row<TData> }) {
  return (
    <div className="flex items-center gap-1">
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="행 선택" />
      <Button
        variant="ghost"
        size="icon"
        aria-label="행 펼치기"
        className={cn(!row.getCanExpand() && 'invisible')}
        onClick={row.getToggleExpandedHandler()}
      >
        {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={row.getIsPinned() ? '행 고정 해제' : '행 고정'}
        className={cn(row.depth > 0 && 'invisible')}
        onClick={() => row.pin(!row.getIsPinned() && 'top', true)}
      >
        <Pin className={row.getIsPinned() ? 'fill-current' : ''} />
      </Button>
    </div>
  );
}
