import { type Column, flexRender, type Row, type Table as TanStackTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ChevronsUpDown, LoaderCircle, Pin, Search, X } from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { Input, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#.generated/shadcn/components/ui';
import { cn } from '#.generated/shadcn/lib/utils';

// ─── Layout constants ──────────────────────────────────────────────────────
const HEADER_HEIGHT = 40; // matches h-10 (TableRow in header)
const ROW_HEIGHT = 48;    // matches h-12 (DataListRow cells)
const TOOLS_COLUMN_ID = 'tools';
const DEFAULT_PRELOAD_THRESHOLD = 8;

// ─── Types ─────────────────────────────────────────────────────────────────
export type DataListProps<TData> = {
  table: TanStackTable<TData>
  onEndReached: () => Promise<void>
  hideHeader?: boolean
  visibleRowCount?: number
  preloadThreshold?: number
  loadingLabel?: string
  emptyLabel?: string
};

type PinnedRowConfig = {
  index: number
  total: number
};

// ─── DataList ──────────────────────────────────────────────────────────────
export function DataList<TData>({
  table,
  onEndReached,
  hideHeader = false,
  visibleRowCount,
  preloadThreshold = DEFAULT_PRELOAD_THRESHOLD,
  loadingLabel = 'Loading more results',
  emptyLabel = 'No results.',
}: DataListProps<TData>) {
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridTemplateColumns = getGridTemplateColumns(table);
  const tableState = table.getState();
  const queryStateKey = JSON.stringify({
    sorting: tableState.sorting,
    columnFilters: tableState.columnFilters,
    globalFilter: tableState.globalFilter,
    grouping: tableState.grouping,
  });

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [queryStateKey]);

  useEffect(() => {
    if (!draggingColumn) return undefined;
    const handleMouseUp = () => setDraggingColumn(null);
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [draggingColumn]);

  return (
    <div
      ref={containerRef}
      data-slot="data-list-container"
      className="scroll w-full"
    >
      <table
        data-slot="data-list"
        className="
          w-full text-sm min-w-max isolate border-separate border-spacing-0
        "
      >
        {!hideHeader && (
          <TableHeader className="contents">
            {table.getHeaderGroups().map((headerGroup) => {
              const visibleHeaders = getPinnedColumns(table)
                .map((col) => headerGroup.headers.find((h) => h.column.id === col.id && !h.isPlaceholder) ?? headerGroup.headers.find((h) => h.column.id === col.id))
                .filter((h): h is NonNullable<typeof h> => !!h);

              return (
                <TableRow
                  key={headerGroup.id}
                  className="
                    sticky top-0 z-50 grid h-10 border-b-0 bg-card
                    hover:bg-transparent
                  "
                  style={{ gridTemplateColumns }}
                >
                  {visibleHeaders.map((header) => (
                    <DataListHead
                      key={header.id}
                      header={header}
                      draggingColumn={draggingColumn}
                      onDragStart={setDraggingColumn}
                      onDragEnter={(targetColumn) => reorderColumn(table, draggingColumn, targetColumn)}
                      onDragEnd={(targetColumn) => {
                        if (!draggingColumn || draggingColumn === targetColumn) return;
                        reorderColumn(table, draggingColumn, targetColumn);
                        setDraggingColumn(null);
                      }}
                    />
                  ))}
                </TableRow>
              );
            })}
          </TableHeader>
        )}
        <DataListBody
          table={table}
          hideHeader={hideHeader}
          gridTemplateColumns={gridTemplateColumns}
          containerRef={containerRef}
          queryStateKey={queryStateKey}
          onEndReached={onEndReached}
          visibleRowCount={visibleRowCount}
          preloadThreshold={preloadThreshold}
          loadingLabel={loadingLabel}
          emptyLabel={emptyLabel}
        />
      </table>
    </div>
  );
}

// ─── DataListBody ──────────────────────────────────────────────────────────
export function DataListBody<TData>({
  table,
  hideHeader = false,
  gridTemplateColumns,
  containerRef,
  queryStateKey,
  onEndReached,
  visibleRowCount,
  preloadThreshold,
  loadingLabel,
  emptyLabel,
}: Pick<DataListProps<TData>, 'table' | 'onEndReached' | 'hideHeader' | 'visibleRowCount' | 'preloadThreshold' | 'loadingLabel' | 'emptyLabel'> & {
  gridTemplateColumns: string
  containerRef: React.RefObject<HTMLDivElement | null>
  queryStateKey: string
}) {
  const pinnedTopRows = table.getTopRows();
  const topRows = pinnedTopRows.flatMap((row) => [row, ...getExpandedDescendants(row)]);
  const topRowIds = new Set(topRows.map((r) => r.id));
  const allCenterRows = table.getCenterRows().filter((r) => !topRowIds.has(r.id));
  const centerRows = allCenterRows.slice(0, visibleRowCount);
  const pinnedColumns = getPinnedColumns(table);
  const requestingNextPageRef = useRef(false);
  const lastRequestedRowCountRef = useRef<number | null>(null);
  const queryStateKeyRef = useRef(queryStateKey);
  const requestTokenRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const scrollMargin = HEADER_HEIGHT + (topRows.length * ROW_HEIGHT);
  const loaderRowCount = 1;

  const rowVirtualizer = useVirtualizer({
    count: centerRows.length + loaderRowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    scrollMargin,
    getItemKey: (index) => centerRows[index]?.id ?? 'data-list-loader',
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  let paddingTop = 0;
  let paddingBottom = 0;
  if (virtualRows.length > 0) {
    paddingTop = virtualRows[0].start - scrollMargin;
    paddingBottom = rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end;
  }
  const lastVirtualRowIndex = virtualRows.at(-1)?.index ?? -1;
  const threshold = Math.max(0, centerRows.length - (preloadThreshold ?? DEFAULT_PRELOAD_THRESHOLD));
  const hasReachedPreloadThreshold = centerRows.length > 0 && lastVirtualRowIndex >= threshold;
  const loadedRowCount = allCenterRows.length;
  const shouldFetchNextPage = hasReachedPreloadThreshold
    && !isLoading
    && !requestingNextPageRef.current
    && lastRequestedRowCountRef.current !== loadedRowCount;

  useEffect(() => {
    if (queryStateKeyRef.current !== queryStateKey) {
      queryStateKeyRef.current = queryStateKey;
      lastRequestedRowCountRef.current = null;
      requestTokenRef.current += 1;
      requestingNextPageRef.current = false;
      setIsLoading(false);
      return undefined;
    }

    if (!hasReachedPreloadThreshold) {
      lastRequestedRowCountRef.current = null;
    }

    if (!shouldFetchNextPage) return undefined;

    lastRequestedRowCountRef.current = loadedRowCount;
    requestingNextPageRef.current = true;
    setIsLoading(true);
    const requestToken = requestTokenRef.current + 1;
    requestTokenRef.current = requestToken;
    void onEndReached()
      .catch(() => undefined)
      .finally(() => {
        if (requestTokenRef.current !== requestToken) return;
        requestingNextPageRef.current = false;
        setIsLoading(false);
      });

    return undefined;
  }, [hasReachedPreloadThreshold, loadedRowCount, onEndReached, queryStateKey, shouldFetchNextPage]);

  return (
    <TableBody className="contents">
      {topRows.map((row, index) => (
        <DataListRow
          key={`top-${row.id}`}
          row={row}
          hideHeader={hideHeader}
          pinnedColumns={pinnedColumns}
          gridTemplateColumns={gridTemplateColumns}
          className="sticky border-b-0 bg-card"
          style={{
            top: `${HEADER_HEIGHT + (index * ROW_HEIGHT)}px`,
            zIndex: 40 + (topRows.length - index),
          }}
          pinnedRowConfig={{ index, total: topRows.length }}
        />
      ))}
      {paddingTop > 0 && (
        <tr style={{ height: `${paddingTop}px`, display: 'block' }} aria-hidden="true" />
      )}
      {virtualRows.map((virtualRow) => {
        if (virtualRow.index === centerRows.length) {
          if (!isLoading) return null;

          return (
            <DataListStatusRow
              key="data-list-loader"
              columnCount={table.getAllColumns().length}
              isLoading={isLoading}
              label={loadingLabel ?? 'Loading more results'}
            />
          );
        }

        const row = centerRows[virtualRow.index];
        if (!row) return null;
        return (
          <DataListRow
            key={row.id}
            row={row}
            hideHeader={hideHeader}
            pinnedColumns={pinnedColumns}
            gridTemplateColumns={gridTemplateColumns}
            className="border-b-0"
          />
        );
      })}
      {paddingBottom > 0 && (
        <tr style={{ height: `${paddingBottom}px`, display: 'block' }} aria-hidden="true" />
      )}
      {centerRows.length === 0 && topRows.length === 0 && !isLoading && (
        <TableRow className="grid border-b-0">
          <TableCell
            colSpan={table.getAllColumns().length}
            className="h-24 text-center text-muted-foreground"
          >
            {emptyLabel}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

function DataListStatusRow({ columnCount, isLoading, label }: { columnCount: number, isLoading: boolean, label: string }) {
  return (
    <TableRow className="grid h-12 border-b-0">
      <TableCell
        colSpan={columnCount}
        className="flex items-center justify-center gap-2 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {isLoading && <LoaderCircle className="size-4 animate-spin" />}
        {label}
      </TableCell>
    </TableRow>
  );
}

// ─── DataListHead ──────────────────────────────────────────────────────────
function DataListHead<TData>({ header, draggingColumn, onDragStart, onDragEnter, onDragEnd }: {
  header: ReturnType<TanStackTable<TData>['getHeaderGroups']>[number]['headers'][number]
  draggingColumn: string | null
  onDragStart: (columnId: string) => void
  onDragEnter: (columnId: string) => void
  onDragEnd: (columnId: string) => void
}) {
  const isPinned = header.column.getIsPinned();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const filterType = header.column.columnDef.meta?.filterType ?? 'text';
  const filterValue = header.column.getFilterValue();
  const isFiltered = hasFilterValue(filterValue);
  const sortDirection = header.column.getIsSorted();
  const sortIndex = header.column.getSortIndex();
  let sortIcon = <ChevronsUpDown className="ml-1 size-3.5 shrink-0" />;
  if (sortDirection === 'asc') sortIcon = (
    <ArrowUp className="ml-1 size-3.5 shrink-0 text-primary" />
  );
  else if (sortDirection === 'desc') sortIcon = (
    <ArrowDown className="ml-1 size-3.5 shrink-0 text-primary" />
  );
  const sortTitle = sortIndex >= 0
    ? `Sort priority ${sortIndex + 1}. Click another column to add it to the sort.`
    : 'Click to add this column to the sort. Use Reset to clear all sorting.';

  useEffect(() => {
    if (!searchOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [searchOpen]);

  return (
    <TableHead
      style={getColumnPinningStyles(header.column)}
      className={cn(
        `
          relative flex h-10 min-w-0 items-center border-r border-border/70
          after:absolute after:inset-x-0 after:bottom-0 after:h-px
          after:bg-border after:z-10 after:pointer-events-none
        `,
        header.column.id === TOOLS_COLUMN_ID && 'px-1',
        'sticky bg-card',
        isPinned ? 'z-60' : 'z-50',
        header.column.getCanHide() && 'cursor-grab',
        draggingColumn === header.column.id && 'cursor-grabbing opacity-50',
      )}
      onMouseDown={(event) => {
        if (!header.column.getCanHide() || (event.target instanceof Element && event.target.closest('[data-resize-handle], [aria-label^="Pin "], [aria-label^="Search "], [aria-label^="Clear "]'))) return;
        event.preventDefault();
        onDragStart(header.column.id);
      }}
      onMouseEnter={() => onDragEnter(header.column.id)}
      onMouseUp={() => onDragEnd(header.column.id)}
    >
      {header.isPlaceholder
        ? null
        : (
          <div ref={searchRef} className="flex w-full items-center gap-1">
            <button type="button" className="flex min-w-0 items-center" onClick={header.column.getToggleSortingHandler()} title={header.column.getCanSort() ? sortTitle : undefined}>
              <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
              {header.column.getCanSort() && (
                <>
                  {sortIcon}
                  {sortIndex >= 0 && (
                    <span
                      className="
                        inline-flex size-4 shrink-0 items-center justify-center
                        rounded-full bg-primary/10 text-[10px] font-semibold
                        text-primary
                      "
                      aria-label={`Sort priority ${sortIndex + 1}`}
                    >
                      {sortIndex + 1}
                    </span>
                  )}
                </>
              )}
            </button>
            {header.column.getCanFilter() && (
              <button
                type="button"
                className={cn(`
                  ml-auto inline-flex size-6 items-center justify-center
                  rounded-sm text-muted-foreground
                  hover:bg-muted hover:text-foreground
                `, isFiltered && `text-primary`)}
                aria-label={`Search ${header.column.id} column`}
                title={`Search ${header.column.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSearchOpen((open) => !open);
                }}
              >
                <Search className="size-3.5" />
              </button>
            )}
            {header.column.getCanPin() && (
              <button
                type="button"
                className={cn(`
                  inline-flex size-6 items-center justify-center rounded-sm
                  text-muted-foreground
                  hover:bg-muted hover:text-foreground
                `, isPinned && `text-primary`)}
                aria-label={`Pin ${header.column.id} column`}
                title={isPinned ? 'Unpin column' : 'Pin column to left'}
                onClick={(event) => {
                  event.stopPropagation();
                  header.column.pin(isPinned ? false : 'left');
                }}
              >
                <Pin className={cn('size-3.5', isPinned && 'fill-current')} />
              </button>
            )}
            {searchOpen && (
              <div
                className="
                  absolute top-full left-0 z-10 mt-1 flex w-56 flex-col gap-2
                  rounded-md border bg-popover p-2 shadow-md
                "
                onMouseDown={(event) => event.stopPropagation()}
              >
                <ColumnFilter column={header.column} filterType={filterType} filterValue={filterValue} />
                {isFiltered && (
                  <button
                    type="button"
                    className="
                      flex w-full items-center justify-center gap-1 rounded-sm
                      border border-border/70 h-7 px-2 text-xs
                      text-muted-foreground
                      hover:bg-muted hover:text-foreground
                    "
                    aria-label={`Clear ${header.column.id} search`}
                    onClick={() => header.column.setFilterValue(undefined)}
                  >
                    <X className="size-3.5" />
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      <DataListResizeHandle header={header} />
    </TableHead>
  );
}

// ─── DataListResizeHandle ──────────────────────────────────────────────────
function DataListResizeHandle<TData>({ header }: { header: ReturnType<TanStackTable<TData>['getHeaderGroups']>[number]['headers'][number] }) {
  const canResize = header.column.getCanResize();

  return (
    <div
      data-resize-handle
      onMouseDown={canResize ? header.getResizeHandler() : undefined}
      onTouchStart={canResize ? header.getResizeHandler() : undefined}
      className={cn('absolute inset-y-0 right-0 z-20 w-px bg-transparent', canResize && `
        cursor-col-resize touch-none
        hover:bg-primary
      `, header.column.getIsResizing() && `bg-primary`)}
      aria-label={canResize ? `Resize ${header.id} column` : undefined}
      aria-hidden={!canResize}
      title={canResize ? 'Drag to resize' : undefined}
    />
  );
}

// ─── ColumnFilter ───────────────────────────────────────────────────────────
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
            <button
              key={option.value}
              type="button"
              className={cn(`
                flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm
                hover:bg-muted
              `, selected && `bg-muted`)}
              aria-pressed={selected}
              onClick={() => column.setFilterValue(selected ? selectedValues.filter((value) => value !== option.value) : [...selectedValues, option.value])}
            >
              <span className={cn(`
                flex size-4 items-center justify-center rounded-sm border
              `, selected && `border-primary bg-primary text-primary-foreground`)}
              >
                {selected ? '✓' : null}
              </span>
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
        <Input
          type="number"
          value={getRangeValue<number>(filterValue, 0) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 0, event.target.value === '' ? undefined : Number(event.target.value))}
          placeholder="Min"
          aria-label={`Search ${column.id} minimum`}
          className="h-8"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          value={getRangeValue<number>(filterValue, 1) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 1, event.target.value === '' ? undefined : Number(event.target.value))}
          placeholder="Max"
          aria-label={`Search ${column.id} maximum`}
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
          aria-label={`Search ${column.id} start date`}
          className="h-8"
        />
        <Input
          type="date"
          value={getRangeValue<string>(filterValue, 1) ?? ''}
          onChange={(event) => setRangeFilterValue(column, 1, event.target.value || undefined)}
          aria-label={`Search ${column.id} end date`}
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
      placeholder={`Search ${column.id}...`}
      aria-label={`Search ${column.id} column value`}
      className="h-8"
    />
  );
}

// ─── Utility functions ──────────────────────────────────────────────────────
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

function reorderColumn<TData>(table: TanStackTable<TData>, draggingColumn: string | null, targetColumn: string) {
  if (!draggingColumn || draggingColumn === TOOLS_COLUMN_ID || targetColumn === TOOLS_COLUMN_ID || draggingColumn === targetColumn) return;
  const order = table.getAllLeafColumns().map((column) => column.id);
  const from = order.indexOf(draggingColumn);
  const to = order.indexOf(targetColumn);
  if (from < 0 || to < 0) return;
  order.splice(from, 1);
  order.splice(to, 0, draggingColumn);
  table.setColumnOrder(order);
}

function getColumnPinningStyles<TData>(column: Column<TData, unknown>): CSSProperties {
  const isPinned = column.getIsPinned();
  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
  };
}

function getPinnedColumns<TData>(table: TanStackTable<TData>) {
  return [
    ...table.getLeftVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getRightVisibleLeafColumns(),
  ];
}

function getExpandedDescendants<TData>(row: Row<TData>): Row<TData>[] {
  if (!row.getIsExpanded()) return [];
  return row.subRows.flatMap((subRow) => [subRow, ...getExpandedDescendants(subRow)]);
}

function getGridTemplateColumns<TData>(table: TanStackTable<TData>) {
  const columns = getPinnedColumns(table);
  const flexibleColumnId = [...columns].reverse().find((column) => column.id !== TOOLS_COLUMN_ID)?.id;

  return columns.map((column) => {
    if (column.id === TOOLS_COLUMN_ID) return '100px';
    const minSize = column.columnDef.minSize ?? table.options.defaultColumn?.minSize ?? 20;
    return column.id === flexibleColumnId ? `minmax(${minSize}px, 1fr)` : `${column.getSize()}px`;
  }).join(' ');
}

// ─── DataListRow ───────────────────────────────────────────────────────────
function DataListRow<TData>({
  row,
  hideHeader = false,
  pinnedColumns,
  gridTemplateColumns,
  className,
  style,
  ref,
  pinnedRowConfig,
}: {
  row: ReturnType<TanStackTable<TData>['getRowModel']>['rows'][number]
  hideHeader?: boolean
  pinnedColumns: ReturnType<typeof getPinnedColumns<TData>>
  gridTemplateColumns: string
  className?: string
  style?: CSSProperties
  ref?: (node: HTMLTableRowElement | null) => void
  pinnedRowConfig?: PinnedRowConfig
}) {
  const allCellsMap = new Map(row.getAllCells().map((cell) => [cell.column.id, cell]));
  const cells = pinnedColumns.map((col) => allCellsMap.get(col.id)).filter((cell): cell is NonNullable<typeof cell> => !!cell);

  const cellZIndexBase = pinnedRowConfig
    ? 40 + (pinnedRowConfig.total - pinnedRowConfig.index)
    : 0;

  return (
    <TableRow
      ref={ref}
      data-state={row.getIsSelected() && 'selected'}
      className={cn('group grid h-12', className)}
      style={{ ...style, gridTemplateColumns }}
    >
      {cells.map((cell) => {
        const isColumnPinned = cell.column.getIsPinned();
        const cellStyle: CSSProperties = {
          ...getColumnPinningStyles(cell.column),
          zIndex: isColumnPinned ? cellZIndexBase + 10 : undefined,
        };

        return (
          <TableCell
            key={cell.id}
            style={cellStyle}
            className={cn(
              `
                relative flex h-12 min-w-0 items-center bg-card
                group-hover:bg-muted
                after:absolute after:inset-x-0 after:bottom-0 after:h-px
                after:bg-border after:z-10 after:pointer-events-none
              `,
              !hideHeader && 'border-r border-border/70',
              cell.column.id === TOOLS_COLUMN_ID && 'px-1',
              isColumnPinned && 'sticky',
            )}
          >
            {cell.column.id === TOOLS_COLUMN_ID
              ? flexRender(cell.column.columnDef.cell, cell.getContext())
              : <span className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
