import type { ColumnDef } from '@tanstack/react-table';
import { Ellipsis, Eye, Trash2 } from 'lucide-react';

import type { OperatingHolidayItemDto } from '#/.generated/api/model';
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';

type HolidayRow = OperatingHolidayItemDto & { dayOfWeek: string };

export function createOperationsColumns(
  onRemove: (date: string) => void,
  onOpenDetail: (holiday: HolidayRow) => void,
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
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterMultiple: false,
        filterOptions: [
          { label: '법정 공휴일', value: 'STATUTORY' },
          { label: '특별 지정', value: 'CUSTOM' },
        ],
      },
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
      id: 'tools',
      header: '도구',
      size: 80,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(props) => (
                <Button
                  {...props}
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="도구"
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onClick?.(event);
                  }}
                >
                  <Ellipsis className="size-4" />
                </Button>
              )}
            />
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onClick={() => onOpenDetail(row.original)}>
                <Eye className="size-4" />
                상세
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onRemove(row.original.date)}>
                <Trash2 className="size-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
