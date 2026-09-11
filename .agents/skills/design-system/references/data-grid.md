# DataGrid

## Sources

- Implementation: `template/react-starter-kit/src/components/data-grid/`
- State hook: `use-data-grid.ts`
- Column tools: `data-grid-tool-header.tsx`, `data-grid-tool-column.tsx`

## Usage

- Define columns with `createColumnHelper<T>()` and generated API model types.
- Build table state with `useDataGrid`; connect search, sorting, and pagination callbacks to the screen's API request.
- Standard composition: `DataGridToolbar`, `DataGrid`, and `DataTablePagination`.
- Current `DataGrid` props: `table`, `hideHeader`, `hasMore`, `onScrollEnd`, and `onRowClick`.
- `loading` is not an external prop. `DataGrid` manages infinite-scroll loading; handle initial API loading at screen level with `PageSection.Loading`.
- `totalCount` belongs to API response metadata. Pass it to TanStack Table's `rowCount` or `DataTablePagination` when needed, not to `DataGrid`.
- `recordName` is not a supported prop; do not add new usages.
- Use `hasMore` and `onScrollEnd` for infinite scrolling and check the implementation for loading and row rendering behavior.
- Follow actual column definitions and `data-grid-tool-header.tsx` for sorting, filtering, and tool-column contracts.
