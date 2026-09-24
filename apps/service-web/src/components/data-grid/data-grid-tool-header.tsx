/* eslint-disable */
import { valueIf, when } from '@pkg/shared/common';
import { type Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Pin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, Input } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

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
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();
  const filterValue = column.getFilterValue();
  const columnMeta = column.columnDef.meta as DataGridColumnMeta | undefined;
  const filterType = columnMeta?.filterType ?? 'text';
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  let sortIcon = <ChevronsUpDown />;
  if (sorted === 'asc') sortIcon = <ArrowUp />;
  else if (sorted === 'desc') sortIcon = <ArrowDown />;

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
        <Button variant="ghost" size="icon" aria-label={`${column.id} 정렬`} onClick={column.getToggleSortingHandler()}>
          {sortIcon}
        </Button>
      )}
      {column.getCanFilter() && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${column.id} 열 검색`}
          className={cn(hasFilterValue(filterValue) && `text-primary`)}
          onClick={() => setSearchOpen((open) => !open)}
        >
          <Search />
        </Button>
      )}
      {column.getCanPin() && (
        <Button variant="ghost" size="icon" aria-label={pinned ? `${column.id} 열 고정 해제` : `${column.id} 열 고정`} onClick={() => column.pin(pinned ? false : 'left')}>
          <Pin className={cn(pinned && 'fill-current')} />
        </Button>
      )}
      {searchOpen && (
        <div className="
          absolute top-full right-0 z-30 mt-1 flex w-56 flex-col gap-2
          rounded-md border bg-popover p-2 shadow-md
        "
        >
          <ColumnFilter column={column} filterType={filterType} filterValue={filterValue} />
          {hasFilterValue(filterValue) && (
            <Button variant="outline" size="sm" aria-label="필터 지우기" onClick={() => column.setFilterValue(undefined)}>
              <X />
              필터 지우기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ColumnFilter<TData>({ column, filterType, filterValue }: {
  column: Column<TData, unknown>
  filterType: ColumnFilterType
  filterValue: unknown
}) {
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
          placeholder="최소"
          aria-label={`${column.id} 최소값 검색`}
          className="h-8"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          value={getRangeValue<number>(filterValue, 1) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 1, event.target.value === '' ? undefined : Number(event.target.value))}
          placeholder="최대"
          aria-label={`${column.id} 최대값 검색`}
          className="h-8"
        />
      </div>
    );
  }

  if (filterType === 'date') {
    return (
      <div className="grid gap-2">
        <Input
          type="date"
          value={getRangeValue<string>(filterValue, 0) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 0, event.target.value || undefined)}
          aria-label={`${column.id} 시작일 검색`}
          className="h-8"
        />
        <Input
          type="date"
          value={getRangeValue<string>(filterValue, 1) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 1, event.target.value || undefined)}
          aria-label={`${column.id} 종료일 검색`}
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
      placeholder={`${column.id} 검색...`}
      aria-label={`${column.id} 값 검색`}
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
