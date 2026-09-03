import { type ColumnDef, type Row, type Table } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Pin } from 'lucide-react';

import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

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
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label={t('dataGrid.selectAll')} />
    </div>
  );
}

function DataGridToolCell<TData>({ row }: { row: Row<TData> }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-1">
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label={t('dataGrid.selectRow')} />
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('dataGrid.expandRow')}
        className={cn(!row.getCanExpand() && 'invisible')}
        onClick={row.getToggleExpandedHandler()}
      >
        {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={row.getIsPinned() ? t('dataGrid.unpinRow') : t('dataGrid.pinRow')}
        className={cn(row.depth > 0 && 'invisible')}
        onClick={() => row.pin(!row.getIsPinned() && 'top', true)}
      >
        <Pin className={row.getIsPinned() ? 'fill-current' : ''} />
      </Button>
    </div>
  );
}
