/* eslint-disable */
import { Popover } from '@base-ui/react/popover';
import { valueIf, when } from '@pkg/shared/common';
import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Pin, Search, X } from 'lucide-react';
import { useState } from 'react';

import { Button, Input } from '#ui';
import { cn } from '#.generated/shadcn/lib/utils';
import { useI18n } from '#context/i18n';
import { DatePicker } from '#ui/date-time';

export type DataGridToolHeaderProps<TData> = {
  column: Column<TData, unknown>
};

type ColumnFilterType = 'text' | 'number' | 'date' | 'faceted';
type DataGridColumnMeta = {
  filterType?: ColumnFilterType
  filterMultiple?: boolean
  filterOptions?: Array<{ label: string, value: string }>
};

export function DataGridToolHeader<TData>({ column }: DataGridToolHeaderProps<TData>) {
  const { t } = useI18n();
  const columnName = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();
  const filterValue = column.getFilterValue();
  const columnMeta = column.columnDef.meta as DataGridColumnMeta | undefined;
  const filterType = columnMeta?.filterType ?? 'text';
  const [searchOpen, setSearchOpen] = useState(false);
  let sortIcon = <ChevronsUpDown />;
  if (sorted === 'asc') sortIcon = <ArrowUp />;
  else if (sorted === 'desc') sortIcon = <ArrowDown />;

  return (
    <Popover.Root open={searchOpen} onOpenChange={setSearchOpen}>
      <div className="relative ml-auto flex shrink-0 gap-1">
        {column.getCanSort() && (
          <Button variant="ghost" size="icon" aria-label={t('core.dataGrid.sortColumn', { column: columnName })} onClick={column.getToggleSortingHandler()}>
            {sortIcon}
          </Button>
        )}
        {column.getCanFilter() && (
          <Popover.Trigger render={<Button variant="ghost" size="icon" aria-label={t('core.dataGrid.searchColumn', { column: columnName })} className={cn(hasFilterValue(filterValue) && `text-primary`)} />}>
            <Search />
          </Popover.Trigger>
        )}
        {column.getCanPin() && (
          <Button variant="ghost" size="icon" aria-label={pinned ? t('core.dataGrid.unpinColumn', { column: columnName }) : t('core.dataGrid.pinColumn', { column: columnName })} onClick={() => column.pin(pinned ? false : 'left')}>
            <Pin className={cn(pinned && 'fill-current')} />
          </Button>
        )}
        {searchOpen && (
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
              <Popover.Popup className="flex w-56 flex-col gap-2 rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
                <ColumnFilter column={column} filterType={filterType} filterValue={filterValue} />
                {hasFilterValue(filterValue) && (
                  <Button variant="outline" size="sm" aria-label={t('core.dataGrid.clearFilter')} onClick={() => column.setFilterValue(undefined)}>
                    <X />
                    {t('core.dataGrid.clearFilter')}
                  </Button>
                )}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </div>
    </Popover.Root>
  );
}

function ColumnFilter<TData>({ column, filterType, filterValue }: {
  column: Column<TData, unknown>
  filterType: ColumnFilterType
  filterValue: unknown
}) {
  const { t } = useI18n();
  const columnName = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
  if (filterType === 'faceted') {
    const selectedValues = Array.isArray(filterValue) ? filterValue as string[] : [];
    const columnMeta = column.columnDef.meta as DataGridColumnMeta | undefined;
    return (
      <div className="grid gap-1">
        {columnMeta?.filterOptions?.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(`
                flex h-auto w-full items-center justify-start gap-2 rounded-sm
                px-2 py-1.5 text-left text-sm font-normal
                hover:bg-muted
              `, selected && `bg-muted`)}
              aria-pressed={selected}
              onClick={() => column.setFilterValue(
                selected
                  ? selectedValues.filter((value) => value !== option.value)
                  : columnMeta?.filterMultiple === false ? [option.value] : [...selectedValues, option.value],
              )}
            >
              <span className={cn(`
                flex size-4 items-center justify-center rounded-sm border
              `, selected && `border-primary bg-primary text-primary-foreground`)}
              >
                {selected ? '✓' : null}
              </span>
              {option.label}
            </Button>
          );
        })}
      </div>
    );
  }

  if (filterType === 'number') {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <Input
          type="number"
          value={getRangeValue<number>(filterValue, 0) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 0, event.target.value === '' ? undefined : Number(event.target.value))}
          placeholder={t('core.dataGrid.min')}
          aria-label={t('core.dataGrid.searchMinimum', { column: columnName })}
          className="h-8"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          value={getRangeValue<number>(filterValue, 1) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 1, event.target.value === '' ? undefined : Number(event.target.value))}
          placeholder={t('core.dataGrid.max')}
          aria-label={t('core.dataGrid.searchMaximum', { column: columnName })}
          className="h-8"
        />
      </div>
    );
  }

  if (filterType === 'date') {
    return (
      <div className="grid gap-2">
        <DatePicker
          value={getRangeValue<string>(filterValue, 0)}
          onChange={(value) => setRangeFilterValue(column, 0, value)}
          placeholder={t('core.dataGrid.searchStartDate', { column: columnName })}
          aria-label={t('core.dataGrid.searchStartDate', { column: columnName })}
          className="h-8"
        />
        <DatePicker
          value={getRangeValue<string>(filterValue, 1)}
          onChange={(value) => setRangeFilterValue(column, 1, value)}
          placeholder={t('core.dataGrid.searchEndDate', { column: columnName })}
          aria-label={t('core.dataGrid.searchEndDate', { column: columnName })}
          className="h-8"
        />
      </div>
    );
  }

  return (
    <Input
      autoFocus
      value={typeof filterValue === 'string' ? filterValue : ''}
      onChange={(event) => column.setFilterValue(event.target.value || undefined)}
      placeholder={t('core.dataGrid.searchPlaceholder', { column: columnName })}
      aria-label={t('core.dataGrid.searchValue', { column: columnName })}
      className="h-8"
    />
  );
}

function hasFilterValue(value: unknown) {
  return Array.isArray(value) ? value.some((item) => item !== undefined && item !== '') : value !== undefined && value !== '';
}

function getRangeValue<T>(value: unknown, index: number) {
  return when(Array.isArray, (values) => values[index] as T | undefined)(value);
}

function setRangeFilterValue<TData>(column: Column<TData, unknown>, index: number, value: string | number | undefined) {
  const range = [getRangeValue(column.getFilterValue(), 0), getRangeValue(column.getFilterValue(), 1)];
  range[index] = value;
  column.setFilterValue(valueIf(hasFilterValue(range), range));
}
