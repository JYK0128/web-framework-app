import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type ColumnFiltersState, createColumnHelper } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

import { getSupportControllerListRoomsV1QueryKey, supportControllerListRoomsV1 } from '#/.generated/api/endpoints/support/support';
import type { SupportRoomItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { OperationNotice } from '#/routes/_protected/-components/operation-notice';

import { SupportRoomDetailModal } from './-components/support-room-detail-modal';

export const Route = createFileRoute('/_protected/_app/support/')({ component: SupportPage });

const columnHelper = createColumnHelper<SupportRoomItem>();
const statusOptions = [{ label: '대기', value: 'open' }, { label: '상담 중', value: 'in_progress' }, { label: '종료', value: 'closed' }] as const;
const statusLabels: Record<SupportRoomItem['status'], string> = { open: '대기', in_progress: '상담 중', closed: '종료' };

function SupportPage() {
  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const selectedStatuses = columnFilters.find((filter) => filter.id === 'status')?.value;
  const status = Array.isArray(selectedStatuses) ? statusOptions.find((option) => option.value === selectedStatuses[0])?.value : undefined;
  const params = { limit: 20, search: search.trim() || undefined, status };
  const query = useInfiniteQuery({
    queryKey: getSupportControllerListRoomsV1QueryKey(params),
    queryFn: ({ pageParam, signal }) => supportControllerListRoomsV1({ ...params, cursor: pageParam }, undefined, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.endCursor ?? undefined : undefined,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const openRoom = useCallback((room: SupportRoomItem) => {
    void openModal(SupportRoomDetailModal, { room });
  }, []);
  const table = useDataGrid({
    client: false,
    defaultColumn: { enableSorting: false },
    data: items,
    columns: [
      columnHelper.accessor('title', {
        header: '상담 제목',
        cell: ({ getValue }) => (
          <span className="font-medium">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('status', { header: '상태', enableColumnFilter: true, meta: { filterType: 'faceted', filterMultiple: false, filterOptions: [...statusOptions] }, cell: ({ row }) => statusLabels[row.original.status] }),
      columnHelper.accessor('lastMessageAt', { header: '최근 메시지', cell: ({ row }) => typeof row.original.lastMessageAt === 'string' ? new Date(row.original.lastMessageAt).toLocaleString('ko-KR') : '-' }),
    ],
    getRowId: (row) => row.id,
    onGlobalFilterChange: (value) => {
      setSearch(typeof value === 'string' ? value : '');
    },
    onColumnFiltersChange: (value) => {
      setColumnFilters(value);
    },
  });

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="messages-square" title="고객지원" description="상담원에게 도움을 요청하고 대화할 수 있습니다.">
        <PageSection.Actions>
          <Button type="button" variant="outline" onClick={() => void openModal(SupportRoomDetailModal, {})}>새 상담 시작</Button>
        </PageSection.Actions>
        <PageSection.Content className="
          mx-auto grid size-full min-w-0 max-w-5xl
          grid-rows-[auto_minmax(0,1fr)] gap-4 pt-2
        "
        >
          <OperationNotice />
          <SectionCard textSize="sm" title="내 상담" description="상담방을 열어 메시지를 확인하고 이어서 대화할 수 있습니다.">
            <SectionCard.Content className="
              grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden
            "
            >
              <DataGridToolbar
                table={table}
                searchPlaceholder="상담 제목 검색"
                onReset={() => {
                  setSearch('');
                  setColumnFilters([]);
                }}
              />
              <div className="grid grid-rows-[minmax(0,1fr)] overflow-hidden">
                {query.isLoading && <Skeleton className="h-32 w-full" />}
                {query.isError && <p className="text-sm text-destructive">고객지원 상담 목록을 불러오지 못했습니다.</p>}
                {!query.isLoading && !query.isError && <DataGrid table={table} hasMore={query.hasNextPage} onScrollEnd={async () => { if (!query.isFetchingNextPage) await query.fetchNextPage(); }} onRowClick={(row) => openRoom(row.original)} />}
              </div>
            </SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
