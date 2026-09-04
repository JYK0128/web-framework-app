import { when } from '@pkg/shared/common';
import { flexRender, type Row, type Table as TanStackTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { useI18n } from '#/hooks';

import { DataGridToolHeader } from './data-grid-tool-header';

const ROW_HEIGHT = 41;
const HEADER_HEIGHT = 40;
const ROW_OFFSET = 5;

export type DataGridProps<TData> = {
  table: TanStackTable<TData>
  hideHeader?: boolean
  hasMore?: boolean
  onScrollEnd?: () => Promise<void> | void
  onRowClick?: (row: Row<TData>) => void
};

export function DataGrid<TData>({ table, hideHeader = false, hasMore = false, onScrollEnd, onRowClick }: DataGridProps<TData>) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNearEnd, setIsNearEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const endRowIdRef = useRef<string | null>(null);
  const { t } = useI18n();
  const tableState = table.getState();
  const { columnFilters, sorting } = tableState;
  const globalFilter: unknown = tableState.globalFilter;
  const rows = getExpandedRows(table.getCenterRows());
  const topRows = getExpandedRows(table.getTopRows());
  const headerHeight = hideHeader ? 0 : table.getHeaderGroups().length * HEADER_HEIGHT;
  const topOffset = headerHeight + (topRows.length * ROW_HEIGHT);
  // TanStack Virtual intentionally exposes non-memoizable functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan: 10,
    scrollMargin: topOffset,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = (virtualRows[0]?.start ?? topOffset) - topOffset;
  const paddingBottom = virtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0);
  const columns = table.getVisibleLeafColumns();
  const columnCount = columns.length;

  useEffect(() => {
    if (!dragId) return;
    const clearDrag = () => setDragId(null);
    document.addEventListener('mouseup', clearDrag);
    return () => document.removeEventListener('mouseup', clearDrag);
  }, [dragId]);

  useEffect(() => {
    endRowIdRef.current = null;
    containerRef.current?.scrollTo({ top: 0 });
  }, [columnFilters, globalFilter, sorting]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setIsNearEnd(isWithinEndOffset(container));
  }, [rows.length]);

  useEffect(() => {
    const endRowId = rows.at(-1)?.id;

    if (!endRowId) return;

    if (!isNearEnd) {
      endRowIdRef.current = null;
      return;
    }

    if (!onScrollEnd || !hasMore || isLoading) return;
    if (endRowIdRef.current === endRowId) return;

    endRowIdRef.current = endRowId;
    setIsLoading(true);
    void Promise.resolve()
      .then(onScrollEnd)
      .finally(() => setIsLoading(false));
  }, [hasMore, isLoading, isNearEnd, onScrollEnd, rows]);

  return (
    <div
      ref={containerRef}
      className="scroll size-full relative"
      onScroll={(event) => setIsNearEnd(isWithinEndOffset(event.currentTarget))}
    >
      <Table className="table-fixed border-separate border-spacing-0 text-sm" style={{ minWidth: table.getTotalSize() }}>
        {!hideHeader && (
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-10">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      `
                        sticky z-20 border-r border-b
                        first:border-l
                        bg-card
                      `,
                      header.subHeaders.length === 0 && header.column.id !== 'tools' && `
                        cursor-grab
                      `,
                      dragId === header.column.id && `
                        cursor-grabbing opacity-50
                      `,
                    )}
                    style={{ top: headerGroup.depth * HEADER_HEIGHT, width: header.getSize() }}
                    onMouseDown={(event) => {
                      if (header.subHeaders.length > 0 || header.column.id === 'tools' || (event.target instanceof Element && event.target.closest('button, input, [data-resize-handle]'))) return;
                      event.preventDefault();
                      setDragId(header.column.id);
                    }}
                    onMouseEnter={() => reorderColumn(table, dragId, header.column.id)}
                    onMouseUp={() => setDragId(null)}
                  >
                    {header.isPlaceholder
                      ? null
                      : (
                        <div className="flex w-full items-center">
                          <span
                            className="flex-1 truncate"
                            title={when((value): value is string => typeof value === 'string', (header) => header)(header.column.columnDef.header)}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.subHeaders.length === 0 && <DataGridToolHeader column={header.column} />}
                        </div>
                      )}
                    {header.subHeaders.length === 0 && header.column.getCanResize() && (
                      <div
                        data-resize-handle
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={t('core.dataGrid.resizeColumn', { column: header.column.id })}
                        className={cn(`
                          absolute top-0 right-0 z-30 h-full w-1
                          cursor-col-resize touch-none select-none
                        `, header.column.getIsResizing() && `bg-primary`)}
                        onDoubleClick={() => header.column.resetSize()}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          header.getResizeHandler()(event);
                        }}
                        onTouchStart={(event) => {
                          event.stopPropagation();
                          header.getResizeHandler()(event);
                        }}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody>
          {hideHeader && (
            <TableRow aria-hidden="true" className="h-0">
              {columns.map((column) => (
                <TableCell key={column.id} className="h-0 border-0 p-0" style={{ width: column.getSize() }} />
              ))}
            </TableRow>
          )}
          {topRows.map((row, index) => (
            <TableRow
              key={`top-${row.id}`}
              className={cn('h-10', onRowClick && `
                cursor-pointer
                hover:bg-muted/50
              `)}
              onClick={() => onRowClick?.(row)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="
                    sticky truncate border-r border-b
                    first:border-l
                    bg-card py-1
                  "
                  style={{ top: headerHeight + (index * ROW_HEIGHT), zIndex: topRows.length - index, width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {paddingTop > 0 && <TableSpacer height={paddingTop} columnCount={columnCount} />}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;

            return (
              <TableRow
                key={row.id}
                className={cn('h-10', onRowClick && `
                  cursor-pointer
                  hover:bg-muted/50
                `)}
                onClick={() => onRowClick?.(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="
                      truncate border-r border-b
                      first:border-l
                      py-1
                    "
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && <TableSpacer height={paddingBottom} columnCount={columnCount} />}
          {isLoading && rows.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-10 border-b text-center text-muted-foreground"
              >
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  {t('core.dataGrid.loadingMore')}
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {rows.length === 0 && (
        <div
          className="
            sticky top-0 left-0 flex w-full items-center justify-center
            pointer-events-none p-4 text-center
          "
          style={{ height: `calc(100% - ${hideHeader ? 0 : headerHeight}px)` }}
        >
          <span className="text-sm text-muted-foreground">
            {isLoading
              ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  {t('core.dataGrid.loading')}
                </span>
              )
              : t('core.dataGrid.noResults')}
          </span>
        </div>
      )}

    </div>
  );
}

function isWithinEndOffset(container: HTMLDivElement) {
  const distanceToEnd = container.scrollHeight - container.scrollTop - container.clientHeight;
  return distanceToEnd <= ROW_OFFSET * ROW_HEIGHT;
}

function reorderColumn<TData>(table: TanStackTable<TData>, dragId: string | null, targetId: string) {
  if (!dragId || dragId === 'tools' || targetId === 'tools' || dragId === targetId) return;

  const order = table.getAllLeafColumns().map((column) => column.id);
  const from = order.indexOf(dragId);
  const to = order.indexOf(targetId);
  if (from < 0 || to < 0) return;

  order.splice(from, 1);
  order.splice(to, 0, dragId);
  table.setColumnOrder(order);
}

function getExpandedRows<TData>(rows: Row<TData>[]): Row<TData>[] {
  return rows.flatMap((row) => row.getIsExpanded() ? [row, ...row.subRows] : row);
}

type TableSpacerProps = { height: number, columnCount: number };

function TableSpacer({ height, columnCount }: TableSpacerProps) {
  return (
    <TableRow
      aria-hidden="true"
      className="
        border-0
        hover:bg-transparent
      "
    >
      <TableCell colSpan={columnCount} className="h-0 border-0 p-0" style={{ height }} />
    </TableRow>
  );
}
