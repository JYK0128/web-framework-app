import { type Table } from '@tanstack/react-table';
import { Eye, RotateCcw, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, Input } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

export type DataGridToolbarProps<TData> = {
  table: Table<TData>
  searchPlaceholder?: string
  searchOnly?: boolean
  debounceMs?: number
  onReset?: () => void
};

export function DataGridToolbar<TData>({
  table,
  searchPlaceholder: searchPlaceholderProp,
  searchOnly = false,
  debounceMs = 300,
  onReset,
}: DataGridToolbarProps<TData>) {
  const { t } = useI18n();
  const searchPlaceholder = searchPlaceholderProp ?? t('dataGrid.searchAll');
  const [viewOpen, setViewOpen] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);

  const globalFilter = (table.getState().globalFilter ?? '') as string;
  const [searchValue, setSearchValue] = useState<string>(globalFilter);

  // 외부(테이블 리셋 등)에서 globalFilter가 변경되면 로컬 검색어 동기화
  useEffect(() => {
    const timer = setTimeout(() => setSearchValue(globalFilter), 0);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  // debounceMs 후 table.setGlobalFilter 호출 (통합 search로 작동)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== globalFilter) {
        table.setGlobalFilter(searchValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, globalFilter, debounceMs, table]);

  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide() && typeof column.columnDef.header === 'string');
  const isAllColumnsVisible = hideableColumns.every((column) => column.getIsVisible());
  const setAllColumnVisibility = (visible: boolean) => table.setColumnVisibility((current) => ({
    ...current,
    ...Object.fromEntries(hideableColumns.map((column) => [column.id, visible])),
  }));

  useEffect(() => {
    if (!viewOpen) return;

    const closeView = (event: PointerEvent) => {
      if (event.target instanceof Node && !viewRef.current?.contains(event.target)) setViewOpen(false);
    };

    document.addEventListener('pointerdown', closeView);
    return () => document.removeEventListener('pointerdown', closeView);
  }, [viewOpen]);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b p-4">
      <div className={cn('relative w-full max-w-sm', searchOnly && 'ml-auto')}>
        <Search className="
          absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground
        "
        />
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>
      {!searchOnly && (
        <div className="ml-auto flex items-center gap-2">
          <div ref={viewRef} className="relative">
            <Button variant="outline" onClick={() => setViewOpen((open) => !open)}>
              <Eye />
              {' '}
              {t('dataGrid.view')}
            </Button>
            {viewOpen && (
              <div className="
                absolute right-0 z-50 mt-2 flex max-h-72 w-52 flex-col
                overflow-hidden rounded-lg border bg-popover
                text-popover-foreground shadow-md
              "
              >
                <div className="shrink-0 border-b p-2">
                  <p className="
                    px-2 py-1 text-xs font-medium text-muted-foreground
                  "
                  >
                    {t('dataGrid.toggleColumns')}
                  </p>
                  <div className="grid">
                    <Button variant="ghost" size="sm" onClick={() => setAllColumnVisibility(!isAllColumnsVisible)}>{isAllColumnsVisible ? t('dataGrid.hideAll') : t('dataGrid.showAll')}</Button>
                  </div>
                </div>
                <div className="scroll-y min-h-0 flex-1">
                  {hideableColumns.map((column) => (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      key={column.id}
                      className="
                        flex h-auto w-full items-center justify-start gap-2
                        rounded-md px-2 py-1.5 text-left text-sm font-normal
                        hover:bg-accent
                      "
                      onClick={() => column.toggleVisibility(!column.getIsVisible())}
                    >
                      <span className="size-4">{column.getIsVisible() ? '✓' : ''}</span>
                      {column.columnDef.header as string}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              table.reset();
              onReset?.();
              setViewOpen(false);
            }}
          >
            <RotateCcw />
            {t('dataGrid.reset')}
          </Button>
        </div>
      )}
    </div>
  );
}
