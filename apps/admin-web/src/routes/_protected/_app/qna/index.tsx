import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { getQnaControllerListV1QueryKey, useQnaControllerListV1, useQnaControllerRemoveV1 } from '#/.generated/api/endpoints/qna/qna';
import type { QnaItem } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { Action } from '#/components/auth/action';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { authUserAtom } from '#/store/auth';

import { QnaEditorModal } from './-components/qna-editor-modal';

export const Route = createFileRoute('/_protected/_app/qna/')({ component: QnaManagementPage });

const columnHelper = createColumnHelper<QnaItem>();
const statusLabels = { open: '접수', in_progress: '처리 중', answered: '답변 완료', closed: '종료' } as const;
const priorityLabels = { low: '낮음', normal: '보통', high: '높음', urgent: '긴급' } as const;

function QnaManagementPage() {
  const user = useAtomValue(authUserAtom);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QnaItem['status']>();
  const [priority, setPriority] = useState<QnaItem['priority']>();
  const query = useQnaControllerListV1({ page, limit: 20, search: search.trim() || undefined, status, priority });
  const remove = useQnaControllerRemoveV1();
  const canUpdate = user?.permissions.includes('qna:update') ?? false;
  const openEditor = useCallback((qna: QnaItem) => {
    void openModal(QnaEditorModal, { qna });
  }, []);
  const openDetail = useCallback((qna: QnaItem) => {
    void openModal(QnaEditorModal, { qna, readOnly: true });
  }, []);
  const handleDelete = useCallback(async (qna: QnaItem) => {
    if (!await confirm({ title: 'Q&A 삭제', description: `“${qna.title}” 문의를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await remove.mutateAsync({ id: qna.id });
    await queryClient.invalidateQueries({ queryKey: getQnaControllerListV1QueryKey() });
  }, [queryClient, remove]);
  const response = query.data?.data;
  const table = useDataGrid({
    client: false,
    data: response?.items ?? [],
    columns: [
      columnHelper.accessor('title', { header: '제목' }),
      columnHelper.accessor('userEmailMasked', { header: '작성자', cell: ({ row }) => row.original.userEmailMasked || row.original.userId }),
      columnHelper.accessor('category', { header: '분류' }),
      columnHelper.accessor('createdAt', { header: '등록일', cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('ko-KR') }),
      columnHelper.accessor('status', {
        header: '상태',
        enableColumnFilter: true,
        meta: {
          filterType: 'faceted',
          filterMultiple: false,
          filterOptions: [
            { label: '접수', value: 'open' },
            { label: '처리 중', value: 'in_progress' },
            { label: '답변 완료', value: 'answered' },
            { label: '종료', value: 'closed' },
          ],
        },
        cell: ({ getValue }) => {
          const status = getValue() as QnaItem['status'];
          return <StatusText tone={statusTone[status]}>{statusLabels[status]}</StatusText>;
        },
      }),
      columnHelper.accessor('priority', {
        header: '우선순위',
        enableColumnFilter: true,
        meta: {
          filterType: 'faceted',
          filterMultiple: false,
          filterOptions: [
            { label: '낮음', value: 'low' },
            { label: '보통', value: 'normal' },
            { label: '높음', value: 'high' },
            { label: '긴급', value: 'urgent' },
          ],
        },
        cell: ({ getValue }) => {
          const priority = getValue() as QnaItem['priority'];
          return <StatusText tone={priorityTone[priority]}>{priorityLabels[priority]}</StatusText>;
        },
      }),
      columnHelper.display({
        id: 'tools',
        header: '도구',
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button
                    {...props}
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="도구"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onClick?.(event);
                    }}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onClick={() => openDetail(row.original)}>
                  <Eye className="size-4" />
                  상세
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canUpdate && (
                  <DropdownMenuItem onClick={() => openEditor(row.original)}>
                    <Pencil className="size-4" />
                    답변
                  </DropdownMenuItem>
                )}
                {canUpdate && <DropdownMenuSeparator />}
                <Action permission="qna:delete">
                  <DropdownMenuItem variant="destructive" onClick={() => void handleDelete(row.original)}>
                    <Trash2 className="size-4" />
                    삭제
                  </DropdownMenuItem>
                </Action>
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
    onColumnFiltersChange: (filters) => {
      const statusValue = filters.find((filter) => filter.id === 'status')?.value;
      const priorityValue = filters.find((filter) => filter.id === 'priority')?.value;
      setPage(1);
      setStatus(Array.isArray(statusValue) ? statusValue[0] as QnaItem['status'] | undefined : undefined);
      setPriority(Array.isArray(priorityValue) ? priorityValue[0] as QnaItem['priority'] | undefined : undefined);
    },
  });
  return (
    <PageSection icon="message-circle-question" title="Q&A 관리" description="고객 문의를 확인하고 답변합니다.">
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] gap-6 p-2">
        <SectionCard textSize="sm" title="문의 목록" description="고객이 등록한 문의와 처리 상태를 확인할 수 있습니다.">
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
                setStatus(undefined);
                setPriority(undefined);
              }}
            />
            <DataGrid table={table} onRowClick={(row) => canUpdate && openEditor(row.original)} />
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}

const statusTone: Record<QnaItem['status'], 'neutral' | 'info' | 'warning' | 'success'> = {
  open: 'info',
  in_progress: 'warning',
  answered: 'success',
  closed: 'neutral',
};

const priorityTone: Record<QnaItem['priority'], 'neutral' | 'info' | 'warning' | 'danger'> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

function StatusText({ children, tone }: { children: string, tone: keyof typeof toneClasses }) {
  return (
    <span className={`
      font-semibold
      ${toneClasses[tone]}
    `}
    >
      {children}
    </span>
  );
}

const toneClasses = {
  neutral: 'text-muted-foreground',
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-amber-600 dark:text-amber-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-destructive',
} as const;
