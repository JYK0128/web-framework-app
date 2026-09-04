import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import type { OperatingHolidayItemDto as HolidayItem } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

type HolidayRow = HolidayItem & { dayOfWeek: string };

export function createOperationsColumns(
  i18n: ReturnType<typeof useI18n>['i18n'],
  onRemove: (date: string) => void,
): ColumnDef<HolidayRow>[] {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  return [
    {
      accessorKey: 'date',
      header: translate('systemConfig.operations.holidayTableDate'),
      size: 140,
      cell: ({ getValue }) => <span className="font-mono font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'name',
      header: translate('systemConfig.operations.holidayTableName'),
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
      header: translate('systemConfig.operations.holidayTableType'),
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
              ? translate('systemConfig.operations.holidayNational')
              : translate('systemConfig.operations.holidayCustom')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: translate('common.manage'),
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
            title={translate('common.cancel')}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
