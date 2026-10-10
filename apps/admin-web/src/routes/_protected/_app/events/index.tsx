import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { eventsControllerListV1, eventsControllerRemoveV1, getEventsControllerListV1QueryKey } from '#/.generated/api/endpoints/events/events';
import type { EventItemDto } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { Action } from '#/components/app/action';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';

import { EventEditorModal } from './-components/event-editor-modal';

export const Route = createFileRoute('/_protected/_app/events/')({ component: EventManagementPage });
const column = createColumnHelper<EventItemDto>();

function EventManagementPage() {
  const user = Route.useRouteContext().user;
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const params = { page, limit: 20, search: search.trim() || undefined };
  const query = useQuery({ queryKey: getEventsControllerListV1QueryKey(params), queryFn: ({ signal }) => eventsControllerListV1(params, undefined, signal) });
  const canCreate = user?.permissions.includes('event:create') ?? false;
  const canUpdate = user?.permissions.includes('event:update') ?? false;
  const remove = useMutation({ mutationFn: ({ id }: { id: string }) => eventsControllerRemoveV1(id) });
  const edit = useCallback((event?: EventItemDto, readOnly = false) => {
    void openModal(EventEditorModal, { event, readOnly });
  }, []);
  const handleDelete = useCallback(async (event: EventItemDto) => {
    if (!await confirm({ title: '이벤트 삭제', description: `“${event.title}” 이벤트를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await remove.mutateAsync({ id: event.id });
    await client.invalidateQueries({ queryKey: getEventsControllerListV1QueryKey() });
  }, [client, remove]);
  const response = query.data;
  const table = useDataGrid({
    client: true,
    data: response?.items ?? [],
    columns: [
      column.accessor('title', {
        header: '제목',
        cell: ({ row }) => (
          <button
            type="button"
            className="
              font-medium
              hover:underline
            "
            onClick={() => edit(row.original, true)}
          >
            {row.original.title}
          </button>
        ),
      }),
      column.accessor('startsAt', { header: '이벤트 기간', cell: ({ row }) => `${new Date(row.original.startsAt).toLocaleString('ko-KR')} ~ ${new Date(row.original.endsAt).toLocaleString('ko-KR')}` }),
      column.accessor('status', { header: '게시 상태', cell: ({ getValue }) => getValue() === 'published' ? '게시' : '임시저장' }),
      column.display({
        id: 'actions',
        header: '관리',
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger render={(props) => (
                <Button
                  {...props}
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="이벤트 관리"
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onClick?.(event);
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              )}
              />
              <DropdownMenuContent align="end">
                {canUpdate && (
                  <DropdownMenuItem onClick={() => edit(row.original)}>
                    <Pencil className="size-4" />
                    수정
                  </DropdownMenuItem>
                )}
                <Action
                  permission="event:delete"
                  render={(
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => void handleDelete(row.original)}>
                        <Trash2 className="size-4" />
                        삭제
                      </DropdownMenuItem>
                    </>
                  )}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
    <PageSection icon="calendar-days" title="이벤트 관리" description="서비스 이벤트의 내용과 진행 기간을 관리합니다.">
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] gap-6 p-2">
        <SectionCard textSize="sm" title="이벤트 목록" description="게시된 이벤트와 임시저장된 이벤트를 함께 확인합니다.">
          {canCreate && (
            <SectionCard.Actions>
              <Button type="button" variant="outline" onClick={() => edit()}>
                <Plus className="size-4" />
                이벤트 등록
              </Button>
            </SectionCard.Actions>
          )}
          <SectionCard.Content className="
            grid h-full grid-rows-[auto_minmax(0,1fr)_auto]
          "
          >
            <DataGridToolbar
              table={table}
              searchPlaceholder="제목 또는 내용 검색..."
              onReset={() => {
                setPage(1);
                setSearch('');
              }}
            />
            {query.isError ? <p className="p-6 text-sm text-destructive">이벤트를 불러오지 못했습니다.</p> : <DataGrid table={table} />}
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
