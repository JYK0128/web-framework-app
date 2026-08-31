import { type ColumnFiltersState, type ColumnOrderState, type ColumnPinningState, type ColumnSizingInfoState, type ExpandedState, getCoreRowModel, getExpandedRowModel, getFilteredRowModel, getGroupedRowModel, getPaginationRowModel, getSortedRowModel, type GlobalFilterTableState, type GroupingState, type InitialTableState, type PaginationState, type Row, type RowPinningState, type RowSelectionState, type SortingState, type Table, type TableOptions, type TableState, type Updater, useReactTable, type VisibilityState } from '@tanstack/react-table';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

type DataGridCallbacks<TData> = {
  onPaginationChange?: (value: PaginationState) => void
  onSortingChange?: (value: SortingState) => void
  onColumnFiltersChange?: (value: ColumnFiltersState) => void
  onGlobalFilterChange?: (value: GlobalFilterTableState['globalFilter']) => void
  onGroupingChange?: (value: GroupingState) => void
  onExpandedChange?: (value: ExpandedState) => void
  onRowSelectionChange?: (value: RowSelectionState) => void
  onChangeRowSelection?: (rows: Row<TData>[]) => void
  onRowPinningChange?: (value: RowPinningState) => void
  onColumnPinningChange?: (value: ColumnPinningState) => void
  onColumnSizingChange?: (value: Record<string, number>) => void
  onColumnSizingInfoChange?: (value: ColumnSizingInfoState) => void
  onColumnOrderChange?: (value: ColumnOrderState) => void
  onColumnVisibilityChange?: (value: VisibilityState) => void
  onChangeState?: (value: TableState) => void
};

type TableCore<TData> = Omit<TableOptions<TData>, 'getCoreRowModel' | 'getPaginationRowModel' | 'getSortedRowModel' | 'getFilteredRowModel' | 'getGroupedRowModel' | 'getExpandedRowModel' | 'manualPagination' | 'manualSorting' | 'manualFiltering' | 'manualGrouping' | 'onStateChange' | 'onPaginationChange' | 'onSortingChange' | 'onColumnFiltersChange' | 'onGlobalFilterChange' | 'onGroupingChange' | 'onExpandedChange' | 'onRowSelectionChange' | 'onRowPinningChange' | 'onColumnPinningChange' | 'onColumnSizingChange' | 'onColumnSizingInfoChange' | 'onColumnOrderChange' | 'onColumnVisibilityChange'>;
type UseDataGridOptions<TData> = TableCore<TData>
  & DataGridCallbacks<TData>
  & {
    cursor?: boolean
    client?: boolean
    initialState?: InitialTableState
  };

function createInitialState<TData>(columns: TableOptions<TData>['columns'], initialState?: InitialTableState): TableState {
  const defaultState: TableState = {
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [],
    rowSelection: {},
    globalFilter: '',
    columnFilters: [],
    columnSizing: {},
    columnSizingInfo: { columnSizingStart: [], deltaOffset: 0, deltaPercentage: 0, isResizingColumn: false, startOffset: 0, startSize: 0 },
    columnOrder: columns.map((column) => column.id ?? ('accessorKey' in column ? String(column.accessorKey) : '')),
    columnVisibility: {},
    expanded: {},
    rowPinning: { top: [], bottom: [] },
    columnPinning: { left: [], right: [] },
    grouping: [],
  };

  return {
    ...defaultState,
    ...initialState,
    pagination: { ...defaultState.pagination, ...initialState?.pagination },
    columnSizingInfo: { ...defaultState.columnSizingInfo, ...initialState?.columnSizingInfo },
  };
}

export function useDataGrid<TData>({
  cursor,
  client,
  data,
  columns,
  initialState,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  onGlobalFilterChange,
  onGroupingChange,
  onExpandedChange,
  onRowSelectionChange,
  onChangeRowSelection,
  onRowPinningChange,
  onColumnPinningChange,
  onColumnSizingChange,
  onColumnSizingInfoChange,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onChangeState,
  ...options
}: UseDataGridOptions<TData>): Table<TData> {
  const [state, setState] = useState<TableState>(() => createInitialState(columns, initialState));

  useEffect(() => onChangeState?.(state), [onChangeState, state]);

  const table = useReactTable({
    ...options,
    autoResetPageIndex: options.autoResetPageIndex ?? false,
    defaultColumn: {
      minSize: 160,
      ...options.defaultColumn,
    },
    isMultiSortEvent: options.isMultiSortEvent ?? (() => true),
    columnResizeMode: options.columnResizeMode ?? 'onChange',
    data,
    columns,
    initialState: createInitialState(columns, initialState),
    state,
    onStateChange: setState,
    // core model
    getCoreRowModel: getCoreRowModel(),
    // pagination model
    manualPagination: !client || cursor,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: handleStateChange(updateState(setState, 'pagination'), onPaginationChange),
    // sorting model
    manualSorting: !client,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: handleStateChange(updateState(setState, 'sorting'), onSortingChange),
    // filtering model
    manualFiltering: !client,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: handleStateChange(updateState(setState, 'columnFilters'), onColumnFiltersChange),
    onGlobalFilterChange: handleStateChange(updateState(setState, 'globalFilter'), onGlobalFilterChange),
    // grouping model
    manualGrouping: !client,
    getGroupedRowModel: getGroupedRowModel(),
    onGroupingChange: handleStateChange(updateState(setState, 'grouping'), onGroupingChange),
    // expanding model
    manualExpanding: options.manualExpanding,
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: handleStateChange(updateState(setState, 'expanded'), onExpandedChange),
    // selection state
    onRowSelectionChange: handleStateChange(updateState(setState, 'rowSelection'), onRowSelectionChange),
    // pinning state
    onRowPinningChange: handleStateChange(updateState(setState, 'rowPinning'), onRowPinningChange),
    onColumnPinningChange: handleStateChange(updateState(setState, 'columnPinning'), onColumnPinningChange),
    // sizing state
    onColumnSizingChange: handleStateChange(updateState(setState, 'columnSizing'), onColumnSizingChange),
    onColumnSizingInfoChange: handleStateChange(updateState(setState, 'columnSizingInfo'), onColumnSizingInfoChange),
    // column layout state
    onColumnOrderChange: handleStateChange(updateState(setState, 'columnOrder'), onColumnOrderChange),
    onColumnVisibilityChange: handleStateChange(updateState(setState, 'columnVisibility'), onColumnVisibilityChange),
  });

  useEffect(() => {
    onChangeRowSelection?.(table.getSelectedRowModel().rows);
  }, [onChangeRowSelection, state.rowSelection, table]);

  return table;
}

function updateState<S, K extends keyof S>(setter: Dispatch<SetStateAction<S>>, key: K): Dispatch<SetStateAction<S[K]>> {
  return (updater) => setter((old) => ({ ...old, [key]: updater instanceof Function ? updater(old[key]) : updater }));
}

function handleStateChange<S>(setter: Dispatch<SetStateAction<S>>, callback?: (value: S) => void) {
  return (updater: Updater<S>) => setter((old) => {
    const value = updater instanceof Function ? updater(old) : updater;
    callback?.(value);
    return value;
  });
}
