import { type ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Pin } from 'lucide-react';

import { Button, Checkbox } from '#.generated/shadcn/components/ui';

export function getDataGridToolsColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'tools',
    size: 100,
    minSize: 100,
    maxSize: 100,
    header: ({ table }) => (
      <div className="flex items-center gap-2">
        <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
        {row.getCanExpand()
          ? <Button variant="ghost" size="icon" title="Expand row" onClick={row.getToggleExpandedHandler()}>{row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}</Button>
          : (
            <span className="size-8" />
          )}
        {row.depth === 0
          ? (
            <Button variant="ghost" size="icon" aria-label={row.getIsPinned() ? 'Unpin row' : 'Pin row'} title={row.getIsPinned() ? 'Unpin row' : 'Pin row'} onClick={() => row.pin(row.getIsPinned() ? false : 'top')}>
              <Pin className={row.getIsPinned()
                ? `fill-current`
                : ''}
              />
            </Button>
          )
          : (
            <span className="size-8" />
          )}
      </div>
    ),
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    enablePinning: false,
  };
}
