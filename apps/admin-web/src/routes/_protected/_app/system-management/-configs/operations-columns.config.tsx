import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import type { OperatingHolidayItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';

type HolidayRow = OperatingHolidayItemDto & { dayOfWeek: string };

export function createOperationsColumns(
  onRemove: (date: string) => void,
): ColumnDef<HolidayRow>[] {
  return [
    {
      accessorKey: 'date',
      header: '날짜',
      size: 140,
      cell: ({ getValue }) => <span className="font-mono font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'name',
      header: '휴무일 명칭',
      size: 240,
      cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'dayOfWeek',
      header: '요일',
      size: 100,
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'type',
      header: '구분',
      size: 130,
      cell: ({ getValue }) => {
        const type = getValue<string>();
        const isStatutory = type === 'STATUTORY';
        return (
          <Badge
            variant={isStatutory ? 'secondary' : 'outline'}
            className="text-xs font-normal"
          >
            {isStatutory
              ? '법정 공휴일'
              : '특별 지정'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '관리',
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(row.original.date);
            }}
            className="
              size-8 cursor-pointer text-muted-foreground
              hover:bg-destructive/10 hover:text-destructive
            "
            title="삭제"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}

