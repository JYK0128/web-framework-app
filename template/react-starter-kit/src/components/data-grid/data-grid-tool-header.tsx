import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Pin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, Input } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

export type DataGridToolHeaderProps<TData> = {
  column: Column<TData, unknown>
};

export function DataGridToolHeader<TData>({ column }: DataGridToolHeaderProps<TData>) {
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
        <Button variant="ghost" size="icon" aria-label={`Sort ${column.id}`} onClick={column.getToggleSortingHandler()}>
          {sorted === 'asc' ? <ArrowUp /> : sorted === 'desc' ? <ArrowDown /> : <ChevronsUpDown />}
        </Button>
      )}
      {column.getCanFilter() && (
        <Button variant="ghost" size="icon" aria-label={`Search ${column.id} column`} className={cn(hasFilterValue(filterValue) && 'text-primary')} onClick={() => setSearchOpen((open) => !open)}>
          <Search />
        </Button>
      )}
      {column.getCanPin() && (
        <Button variant="ghost" size="icon" aria-label={pinned ? `Unpin ${column.id} column` : `Pin ${column.id} column`} onClick={() => column.pin(pinned ? false : 'left')}>
          <Pin className={cn(pinned && 'fill-current')} />
        </Button>
      )}
      {searchOpen && (
        <div className="absolute top-full right-0 z-30 mt-1 flex w-56 flex-col gap-2 rounded-md border bg-popover p-2 shadow-md">
          <ColumnFilter column={column} filterType={filterType} filterValue={filterValue} />
          {hasFilterValue(filterValue) && (
            <Button variant="outline" size="sm" aria-label={`Clear ${column.id} search`} onClick={() => column.setFilterValue(undefined)}>
              <X />
              Clear filter
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
  if (filterType === 'faceted') {
    const selectedValues = Array.isArray(filterValue) ? filterValue as string[] : [];
    return (
      <div className="grid gap-1">
        {column.columnDef.meta?.filterOptions?.map((option) => {
          const selected = selectedValues.includes(option.value);
          return (
            <button key={option.value} type="button" className={cn('flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted', selected && 'bg-muted')} aria-pressed={selected} onClick={() => column.setFilterValue(selected ? selectedValues.filter((value) => value !== option.value) : [...selectedValues, option.value])}>
              <span className={cn('flex size-4 items-center justify-center rounded-sm border', selected && 'border-primary bg-primary text-primary-foreground')}>{selected ? '✓' : null}</span>
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (filterType === 'number') {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <Input type="number" value={getRangeValue<number>(filterValue, 0) ?? ''} onChange={(event) => setRangeFilterValue(column, 0, event.target.value === '' ? undefined : Number(event.target.value))} placeholder="Min" aria-label={`Search ${column.id} minimum`} className="h-8" />
        <span className="text-xs text-muted-foreground">–</span>
        <Input type="number" value={getRangeValue<number>(filterValue, 1) ?? ''} onChange={(event) => setRangeFilterValue(column, 1, event.target.value === '' ? undefined : Number(event.target.value))} placeholder="Max" aria-label={`Search ${column.id} maximum`} className="h-8" />
      </div>
    );
  }

  if (filterType === 'date') {
    return (
      <div className="grid gap-2">
        <Input type="date" value={getRangeValue<string>(filterValue, 0) ?? ''} onChange={(event) => setRangeFilterValue(column, 0, event.target.value || undefined)} aria-label={`Search ${column.id} start date`} className="h-8" />
        <Input type="date" value={getRangeValue<string>(filterValue, 1) ?? ''} onChange={(event) => setRangeFilterValue(column, 1, event.target.value || undefined)} aria-label={`Search ${column.id} end date`} className="h-8" />
      </div>
    );
  }

  return <Input autoFocus value={typeof filterValue === 'string' ? filterValue : ''} onChange={(event) => column.setFilterValue(event.target.value || undefined)} placeholder={`Search ${column.id}...`} aria-label={`Search ${column.id} column value`} className="h-8" />;
}

function hasFilterValue(value: unknown) {
  return Array.isArray(value) ? value.some((item) => item !== undefined && item !== '') : value !== undefined && value !== '';
}

function getRangeValue<T>(value: unknown, index: number) {
  return Array.isArray(value) ? value[index] as T | undefined : undefined;
}

function setRangeFilterValue<TData>(column: Column<TData, unknown>, index: number, value: string | number | undefined) {
  const range = [getRangeValue(column.getFilterValue(), 0), getRangeValue(column.getFilterValue(), 1)];
  range[index] = value;
  column.setFilterValue(hasFilterValue(range) ? range : undefined);
}
