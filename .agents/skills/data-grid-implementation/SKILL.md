---
name: data-grid-implementation
description: >-
  Use when adding or changing React DataGrid screens, columns, search, sorting,
  pagination, or infinite scrolling. Do not apply to ordinary tables unrelated
  to the shared DataGrid.
---

# DataGrid implementation

- Define columns with `createColumnHelper<T>()` and generated API model types.
- Build table state with `useDataGrid`; connect search, sorting, and pagination to the API request.
- Use `DataGridToolbar`, `DataGrid`, and `DataTablePagination` as the standard composition.
- Check the actual component source before using props. `DataGrid` supports `table`, `hideHeader`, `hasMore`, `onScrollEnd`, and `onRowClick`; it does not accept external `loading` or `recordName` props.
- Handle initial loading at screen level with `PageSection.Loading`.
- Keep total counts in API metadata and pass them to TanStack Table or pagination as appropriate.
- For infinite scrolling, use `hasMore` and `onScrollEnd` and verify the implementation's loading behavior.
