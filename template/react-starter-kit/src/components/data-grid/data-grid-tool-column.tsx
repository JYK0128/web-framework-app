import { type ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Pin } from 'lucide-react';

import { Button, Checkbox } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

export function getDataGridToolColumn<TData>(): ColumnDef<TData> {
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
        <Button
          variant="ghost"
          size="icon"
          aria-label="Expand row"
          className={cn(!row.getCanExpand() && 'invisible')}
          onClick={row.getToggleExpandedHandler()}
        >
          {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={row.getIsPinned() ? 'Unpin row' : 'Pin row'}
          className={cn(row.depth > 0 && 'invisible')}
          onClick={() => row.pin(!row.getIsPinned() && 'top', true)}
        >
          <Pin className={row.getIsPinned() ? 'fill-current' : ''} />
        </Button>
      </div>
    ),
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    enablePinning: false,
  };
}
