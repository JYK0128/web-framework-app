import { type Column } from '@tanstack/react-table';
import { valueIf, when } from '@pkg/shared/common';
import { useI18n } from '#/hooks';
import { ArrowDown, ArrowUp, ChevronsUpDown, Pin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, Input } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { DatePicker } from '#/components/date-picker';

export type DataGridToolHeaderProps<TData> = {
  column: Column<TData, unknown>
};

export function DataGridToolHeader<TData>({ column }: DataGridToolHeaderProps<TData>) {
  const { t } = useI18n();
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();
  const filterValue = column.getFilterValue();
  const filterType = column.columnDef.meta?.filterType ?? 'text';
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const closeSearch = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('pointerdown', closeSearch);
    return () => document.removeEventListener('pointerdown', closeSearch);
  }, [searchOpen]);

  return (
    <div ref={searchRef} className="relative ml-auto flex shrink-0 gap-1">
      {column.getCanSort() && (
        <Button variant="ghost" size="icon" aria-label={t('dataGrid.sortColumn', { column: column.id })} onClick={column.getToggleSortingHandler()}>
          {sorted === 'asc' ? <ArrowUp /> : sorted === 'desc' ? <ArrowDown /> : <ChevronsUpDown />}
        </Button>
      )}
      {column.getCanFilter() && (
        <Button variant="ghost" size="icon" aria-label={t('dataGrid.searchColumn', { column: column.id })} className={cn(hasFilterValue(filterValue) && 'text-primary')} onClick={() => setSearchOpen((open) => !open)}>
          <Search />
        </Button>
      )}
      {column.getCanPin() && (
        <Button variant="ghost" size="icon" aria-label={pinned ? t('dataGrid.unpinColumn', { column: column.id }) : t('dataGrid.pinColumn', { column: column.id })} onClick={() => column.pin(pinned ? false : 'left')}>
          <Pin className={cn(pinned && 'fill-current')} />
        </Button>
      )}
      {searchOpen && (
        <div className="absolute top-full right-0 z-30 mt-1 flex w-56 flex-col gap-2 rounded-md border bg-popover p-2 shadow-md">
          <ColumnFilter column={column} filterType={filterType} filterValue={filterValue} />
          {hasFilterValue(filterValue) && (
            <Button variant="outline" size="sm" aria-label={t('dataGrid.clearFilter')} onClick={() => column.setFilterValue(undefined)}>
              <X />
              {t('dataGrid.clearFilter')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ColumnFilter<TData>({ column, filterType, filterValue }: {
  column: Column<TData, unknown>
  filterType: NonNullable<Column<TData, unknown>['columnDef']['meta']>['filterType']
  filterValue: unknown
}) {
  const { t } = useI18n();
  if (filterType === 'faceted') {
    const selectedValues = Array.isArray(filterValue) ? filterValue as string[] : [];
    return (
      <div className="grid gap-1">
        {column.columnDef.meta?.filterOptions?.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <Button key={option.value} type="button" variant="ghost" size="sm" className={cn('flex h-auto w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-normal hover:bg-muted', selected && 'bg-muted')} aria-pressed={selected} onClick={() => column.setFilterValue(selected ? selectedValues.filter((value) => value !== option.value) : [...selectedValues, option.value])}>
              <span className={cn('flex size-4 items-center justify-center rounded-sm border', selected && 'border-primary bg-primary text-primary-foreground')}>{selected ? '✓' : null}</span>
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
        <Input type="number" value={getRangeValue<number>(filterValue, 0) ?? ''} onChange={(event) => setRangeFilterValue(column, 0, event.target.value === '' ? undefined : Number(event.target.value))} placeholder={t('dataGrid.min')} aria-label={t('dataGrid.searchMinimum', { column: column.id })} className="h-8" />
        <span className="text-xs text-muted-foreground">–</span>
        <Input type="number" value={getRangeValue<number>(filterValue, 1) ?? ''} onChange={(event) => setRangeFilterValue(column, 1, event.target.value === '' ? undefined : Number(event.target.value))} placeholder={t('dataGrid.max')} aria-label={t('dataGrid.searchMaximum', { column: column.id })} className="h-8" />
      </div>
    );
  }

  if (filterType === 'date') {
    return (
      <div className="grid gap-2">
        <DatePicker
          value={getRangeValue<string>(filterValue, 0)}
          onChange={(value) => setRangeFilterValue(column, 0, value)}
          placeholder={t('dataGrid.searchStartDate', { column: column.id })}
          aria-label={t('dataGrid.searchStartDate', { column: column.id })}
          className="h-8"
        />
        <DatePicker
          value={getRangeValue<string>(filterValue, 1)}
          onChange={(value) => setRangeFilterValue(column, 1, value)}
          placeholder={t('dataGrid.searchEndDate', { column: column.id })}
          aria-label={t('dataGrid.searchEndDate', { column: column.id })}
          className="h-8"
        />
      </div>
    );
  }

  return <Input autoFocus value={typeof filterValue === 'string' ? filterValue : ''} onChange={(event) => column.setFilterValue(event.target.value || undefined)} placeholder={t('dataGrid.searchPlaceholder', { column: column.id })} aria-label={t('dataGrid.searchValue', { column: column.id })} className="h-8" />;
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
