import { type Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button, Pagination, PaginationContent, PaginationItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { DATA_GRID_PAGE_SIZES } from '#/configs/list.config';

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  rowCount?: number
  length?: number
  size?: number[]
};

const defaultPageSizes = [...DATA_GRID_PAGE_SIZES];

function getVisiblePages(pageIndex: number, pageCount: number, length: number) {
  const half = Math.floor(length / 2);
  let start = Math.max(0, pageIndex - half);

  if (start + length > pageCount) {
    start = Math.max(0, pageCount - length);
  }

  return Array.from({ length: Math.min(length, pageCount) }, (_, index) => start + index);
}

export function DataTablePagination<TData>({ table, rowCount, length = 5, size = defaultPageSizes }: DataTablePaginationProps<TData>) {
  const {
    pagination: { pageIndex, pageSize },
  } = table.getState();
  const pageCount = table.getPageCount();
  const visiblePages = getVisiblePages(pageIndex, pageCount, length);

  return (
    <div className="
      grid grid-cols-[1fr_auto_1fr] items-center border-t p-4 text-sm
      text-muted-foreground
    "
    >
      <div className="whitespace-nowrap">
        {`${rowCount ?? table.getFilteredRowModel().rows.length}개 중 ${table.getFilteredSelectedRowModel().rows.length}개 선택됨`}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button variant="ghost" size="icon" aria-label="첫 페이지로 이동" disabled={!table.getCanPreviousPage()} onClick={() => table.firstPage()}>
              <ChevronsLeft />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button variant="ghost" size="icon" aria-label="이전 페이지로 이동" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
              <ChevronLeft />
            </Button>
          </PaginationItem>
          {visiblePages.map((page) => (
            <PaginationItem key={page}>
              <Button variant={page === pageIndex ? 'outline' : 'ghost'} size="icon" disabled={page === pageIndex} onClick={() => table.setPageIndex(page)}>
                {page + 1}
              </Button>
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button variant="ghost" size="icon" aria-label="다음 페이지로 이동" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              <ChevronRight />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button variant="ghost" size="icon" aria-label="마지막 페이지로 이동" disabled={!table.getCanNextPage()} onClick={() => table.lastPage()}>
              <ChevronsRight />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="
        flex items-center justify-self-end gap-2 whitespace-nowrap
      "
      >
        <span>페이지당 행 수</span>
        <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="max-w-20">
            <SelectValue placeholder="페이지 크기" />
          </SelectTrigger>
          <SelectContent>
            {size.map((value) => <SelectItem key={value} value={`${value}`}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
