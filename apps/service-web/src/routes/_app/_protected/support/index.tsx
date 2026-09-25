import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';

import { useSupportControllerListRoomsV1 } from '#/.generated/api/endpoints/support/support';
import type { SupportRoomItem } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { OperationNotice } from '#/components/operation-notice';

import { SupportRoomDetailModal } from './-components/support-room-detail-modal';

export const Route = createFileRoute('/_app/_protected/support/')({ component: SupportPage });

const columnHelper = createColumnHelper<SupportRoomItem>();
const statusLabels: Record<SupportRoomItem['status'], string> = { open: '대기', in_progress: '상담 중', closed: '종료' };

function SupportPage() {
  const query = useSupportControllerListRoomsV1({ page: 1, limit: 50 });
  const items = useMemo(() => query.data?.data.items ?? [], [query.data?.data.items]);
  const openRoom = useCallback((room: SupportRoomItem) => {
    void openModal(SupportRoomDetailModal, { room });
  }, []);
  const table = useDataGrid({
    client: false,
    cursor: true,
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
      columnHelper.accessor('status', { header: '상태', cell: ({ getValue }) => statusLabels[getValue() as SupportRoomItem['status']] }),
      columnHelper.accessor('lastMessageAt', { header: '최근 메시지', cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleString('ko-KR') : '-' }),
    ],
    getRowId: (row) => row.id,
  });

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="messages-square" title="고객지원" description="상담원에게 도움을 요청하고 대화할 수 있습니다.">
        <PageSection.Actions>
          <Button type="button" onClick={() => void openModal(SupportRoomDetailModal, {})}>새 상담 시작</Button>
        </PageSection.Actions>
        <PageSection.Content className="
          mx-auto grid size-full min-w-0 max-w-5xl
          grid-rows-[auto_minmax(0,1fr)] gap-4 pt-2
        "
        >
          <OperationNotice />
          <SectionCard textSize="sm" title="내 상담" description="상담방을 열어 메시지를 확인하고 이어서 대화할 수 있습니다.">
            <SectionCard.Content className="
              grid h-full min-w-0 grid-rows-[minmax(0,1fr)] overflow-hidden p-4
            "
            >
              {query.isLoading && <Skeleton className="h-32 w-full" />}
              {query.isError && <p className="text-sm text-destructive">고객지원 상담 목록을 불러오지 못했습니다.</p>}
              {!query.isLoading && !query.isError && <DataGrid table={table} onRowClick={(row) => openRoom(row.original)} />}
            </SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
