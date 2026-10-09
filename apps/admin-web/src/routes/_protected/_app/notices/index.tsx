import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { Action } from '#/components/app/action';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { deleteNotice, listNotices, type NoticeImportance, type NoticeItem, noticeKeys } from '#/features/notices/notices.api';

import { NoticeEditorModal } from './-components/notice-editor-modal';

export const Route = createFileRoute('/_protected/_app/notices/')({ component: NoticeManagementPage });
const column = createColumnHelper<NoticeItem>();

function NoticeManagementPage() {
  const user = Route.useRouteContext().user;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const params = { page, limit: 20, search: search.trim() || undefined };
  const query = useQuery({ queryKey: noticeKeys.list(params), queryFn: ({ signal }) => listNotices(params, signal) });
  const canCreate = user?.permissions.includes('notice:create') ?? false;
  const canUpdate = user?.permissions.includes('notice:update') ?? false;
  const remove = useMutation({ mutationFn: deleteNotice });
  const edit = useCallback((notice?: NoticeItem, readOnly = false) => {
    void openModal(NoticeEditorModal, { notice, readOnly });
  }, []);
  const handleDelete = useCallback(async (notice: NoticeItem) => {
    if (!await confirm({ title: '공지사항 삭제', description: `“${notice.title}” 공지를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await remove.mutateAsync(notice.id);
    await queryClient.invalidateQueries({ queryKey: noticeKeys.all });
  }, [queryClient, remove]);
  const response = query.data;
  const table = useDataGrid({
    client: true,
    data: response?.items ?? [],
    columns: [
      column.accessor('importance', { header: '중요도', cell: ({ row }) => <ImportanceBadge value={row.original.importance} /> }),
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
            {row.original.isPinned ? '📌 ' : ''}
            {row.original.title}
          </button>
        ),
      }),
      column.accessor('status', { header: '게시 상태', cell: ({ getValue }) => getValue() === 'published' ? '게시' : '임시저장' }),
      column.accessor('publishedAt', { header: '게시일', cell: ({ getValue }) => getValue() ? new Date(String(getValue())).toLocaleString('ko-KR') : '-' }),
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
                  aria-label="공지 관리"
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
                  permission="notice:delete"
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
    <PageSection icon="megaphone" title="공지사항 관리" description="서비스 공지와 긴급도를 관리합니다.">
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] gap-6 p-2">
        <SectionCard textSize="sm" title="공지 목록" description="긴급 공지는 목록에서 우선 노출됩니다.">
          {canCreate && (
            <SectionCard.Actions>
              <Button type="button" variant="outline" onClick={() => edit()}>
                <Plus className="size-4" />
                공지 등록
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
            {query.isError ? <p className="p-6 text-sm text-destructive">공지사항을 불러오지 못했습니다.</p> : <DataGrid table={table} />}
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}

function ImportanceBadge({ value }: { value: NoticeImportance }) {
  const badge = {
    normal: { label: '일반', className: 'bg-muted text-muted-foreground' },
    important: { label: '중요', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
    urgent: { label: '긴급', className: 'bg-destructive/10 text-destructive' },
  }[value];
  return (
    <span className={`
      rounded-full px-2 py-1 text-xs font-semibold
      ${badge.className}
    `}
    >
      {badge.label}
    </span>
  );
}
