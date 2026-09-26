import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useState } from 'react';

import { getSupportControllerListRoomPiiV1QueryKey, getSupportControllerListRoomsV1QueryKey, useSupportControllerListRoomPiiV1, useSupportControllerListRoomsV1 } from '#/.generated/api/endpoints/support/support';
import type { SupportRoomItem } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { Action } from '#/components/auth/action';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';

import { SupportRoomModal } from './-components/support-room-modal';

export const Route = createFileRoute('/_protected/_app/support/')({ component: SupportPage });

const columnHelper = createColumnHelper<SupportRoomItem>();
const statusLabels: Record<SupportRoomItem['status'], string> = { open: '대기', in_progress: '상담 중', closed: '종료' };

function getPiiToggleLabel(isFetching: boolean, showPii: boolean): string {
  if (isFetching) return '조회 중...';
  if (showPii) return '마스킹 목록 보기';
  return '개인정보 보기';
}

function SupportPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showPii, setShowPii] = useState(false);
  const params = { page, limit: 20, search: search.trim() || undefined };
  const maskedQuery = useSupportControllerListRoomsV1(params, { query: { enabled: !showPii } });
  const piiQuery = useSupportControllerListRoomPiiV1(params, { query: { enabled: showPii } });
  const query = showPii ? piiQuery : maskedQuery;
  const response = query.data?.data;

  useEffect(() => () => {
    queryClient.removeQueries({ queryKey: getSupportControllerListRoomPiiV1QueryKey() });
  }, [queryClient]);

  const togglePii = () => {
    if (!showPii) {
      setShowPii(true);
      return;
    }
    setShowPii(false);
    queryClient.removeQueries({ queryKey: getSupportControllerListRoomPiiV1QueryKey() });
  };
  const openRoom = useCallback((room: SupportRoomItem) => {
    void openModal(SupportRoomModal, { room, onChanged: () => queryClient.invalidateQueries({ queryKey: getSupportControllerListRoomsV1QueryKey() }) });
  }, [queryClient]);
  const table = useDataGrid({
    client: false,
    data: response?.items ?? [],
    columns: [
      columnHelper.accessor('userName', { header: '고객' }),
      columnHelper.accessor('title', { header: '상담 제목' }),
      columnHelper.accessor('status', {
        header: '상태',
        cell: ({ getValue }) => {
          const status = getValue() as SupportRoomItem['status'];
          return <StatusText status={status}>{statusLabels[status]}</StatusText>;
        },
      }),
      columnHelper.accessor('assigneeName', { header: '담당자', cell: ({ getValue }) => getValue() || '미배정' }),
      columnHelper.accessor('lastMessageAt', { header: '최근 메시지', cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleString('ko-KR') : '-' }),
      columnHelper.accessor('createdAt', {
        header: '개설일시',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(String(getValue())).toLocaleString('ko-KR')}
          </span>
        ),
      }),
      columnHelper.accessor('updatedAt', {
        header: '최근 변경',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(String(getValue())).toLocaleString('ko-KR')}
          </span>
        ),
      }),
    ],
    pageCount: response?.totalPages ?? 1,
    initialState: { pagination: { pageIndex: page - 1, pageSize: 20 }, globalFilter: search },
    onPaginationChange: ({ pageIndex }) => setPage(pageIndex + 1),
    onGlobalFilterChange: (value) => {
      setPage(1);
      setSearch(typeof value === 'string' ? value : '');
    },
  });

  return (
    <PageSection icon="messages-square" title="고객지원" description="상담원과 진행하는 고객 상담을 관리합니다.">
      <PageSection.Actions>
        <Action
          permission="support:read_pii"
          render={(
            <Button type="button" variant="outline" size="sm" disabled={piiQuery.isFetching} onClick={togglePii}>
              {getPiiToggleLabel(piiQuery.isFetching, showPii)}
            </Button>
          )}
        />
      </PageSection.Actions>
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] gap-6 p-2">
        <SectionCard textSize="sm" title="상담방 목록" description={`전체 ${response?.totalCount ?? 0}건`}>
          <SectionCard.Content className="
            grid h-full grid-rows-[auto_minmax(0,1fr)_auto]
          "
          >
            <DataGridToolbar
              table={table}
              searchPlaceholder="고객 또는 상담 제목 검색..."
              onReset={() => {
                setPage(1);
                setSearch('');
              }}
            />
            {query.isError && <p className="p-4 text-sm text-destructive">고객지원 상담방을 불러오지 못했습니다.</p>}
            {!query.isError && <DataGrid table={table} onRowClick={(row) => openRoom(row.original)} />}
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}

function StatusText({ status, children }: { status: SupportRoomItem['status'], children: string }) {
  const colors: Record<SupportRoomItem['status'], string> = { open: 'text-blue-600 dark:text-blue-400', in_progress: 'text-amber-600 dark:text-amber-400', closed: 'text-muted-foreground' };
  return (
    <span className={`
      font-semibold
      ${colors[status]}
    `}
    >
      {children}
    </span>
  );
}
