import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type ColumnFiltersState, createColumnHelper, type SortingState } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { qnaControllerListV1, useQnaControllerRemoveV1 } from '#/.generated/api/endpoints/qna/qna';
import type { QnaControllerListV1Params, QnaControllerListV1SortItem, QnaItem } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Skeleton } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { OperationNotice } from '#/routes/_protected/-components/operation-notice';

import { QnaCreateModal } from './-components/qna-create-modal';
import { QnaDetailModal } from './-components/qna-detail-modal';

export const Route = createFileRoute('/_protected/_app/qna/')({ component: QnaPage });

const statusLabels = { open: '접수', in_progress: '처리 중', answered: '답변 완료', closed: '종료' } as const;
const categoryOptions = [{ label: '계정', value: '계정' }, { label: '서비스 이용', value: '서비스 이용' }, { label: '검증', value: '검증' }] as const;
const statusOptions = [{ label: '접수', value: 'open' }, { label: '처리 중', value: 'in_progress' }, { label: '답변 완료', value: 'answered' }, { label: '종료', value: 'closed' }] as const;
const priorityOptions = [{ label: '낮음', value: 'low' }, { label: '보통', value: 'normal' }, { label: '높음', value: 'high' }, { label: '긴급', value: 'urgent' }] as const;

function QnaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const queryParams = useMemo(() => ({
    limit: 20,
    search: search.trim() || undefined,
    category: filterOption(columnFilters, 'category', categoryOptions),
    status: filterOption(columnFilters, 'status', statusOptions),
    priority: filterOption(columnFilters, 'priority', priorityOptions),
    sort: sorting.map((item) => item.id as QnaControllerListV1SortItem),
    direction: sorting.map((item): 'asc' | 'desc' => item.desc ? 'desc' : 'asc'),
  } satisfies QnaControllerListV1Params), [search, columnFilters, sorting]);
  const query = useInfiniteQuery({
    queryKey: ['service-qna-list', queryParams],
    queryFn: ({ pageParam, signal }) => qnaControllerListV1({ ...queryParams, page: pageParam }, undefined, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
  const remove = useQnaControllerRemoveV1();
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const handleDelete = useCallback(async (item: QnaItem) => {
    if (!await confirm({ title: '문의 삭제', description: `“${item.title}” 문의를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await remove.mutateAsync({ id: item.id });
    await queryClient.invalidateQueries({ queryKey: ['service-qna-list'] });
  }, [queryClient, remove]);
  const columns = useMemo(() => {
    const helper = createColumnHelper<QnaItem>();
    return [
      helper.accessor('category', { header: '분류', enableSorting: false, enableColumnFilter: true, meta: { filterType: 'faceted', filterMultiple: false, filterOptions: [...categoryOptions] } }),
      helper.accessor('title', {
        header: '제목',
        enableSorting: false,
        cell: (context) => (
          <span className="font-medium">
            {context.getValue()}
          </span>
        ),
      }),
      helper.accessor('status', { header: '상태', enableSorting: false, enableColumnFilter: true, meta: { filterType: 'faceted', filterMultiple: false, filterOptions: [...statusOptions] }, cell: (context) => statusLabels[context.getValue()] }),
      helper.accessor('priority', { header: '우선순위', enableSorting: false, enableColumnFilter: true, meta: { filterType: 'faceted', filterMultiple: false, filterOptions: [...priorityOptions] }, cell: (context) => priorityOptions.find((option) => option.value === context.getValue())?.label }),
      helper.accessor('createdAt', { header: '등록일시', cell: (context) => new Date(context.getValue()).toLocaleString('ko-KR') }),
      helper.display({
        id: 'tools',
        header: '도구',
        size: 60,
        minSize: 60,
        maxSize: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        cell: (context) => <QnaTools item={context.row.original} onDelete={handleDelete} />,
      }),
    ];
  }, [handleDelete]);
  const table = useDataGrid({
    client: false,
    isMultiSortEvent: () => false,
    data: items,
    columns,
    getRowId: (row) => row.id,
    initialState: { sorting: [{ id: 'createdAt', desc: true }] },
    onGlobalFilterChange: (value) => setSearch(typeof value === 'string' ? value : ''),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
  });
  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="message-circle-question" title="Q&A" description="문의 내용을 등록하고 답변을 확인할 수 있습니다.">
        <PageSection.Actions>
          <Button type="button" variant="outline" onClick={() => void openModal(QnaCreateModal)}>문의 등록</Button>
        </PageSection.Actions>
        <PageSection.Content className="
          mx-auto grid size-full min-w-0 max-w-5xl
          grid-rows-[auto_minmax(0,1fr)] gap-4 pt-2
        "
        >
          <OperationNotice />
          <SectionCard textSize="sm" title="내 문의" description="등록한 문의의 처리 상태와 답변을 확인합니다.">
            <SectionCard.Content className="
              grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden
            "
            >
              <DataGridToolbar
                table={table}
                searchPlaceholder="제목 또는 내용 검색"
                onReset={() => {
                  setSearch('');
                  setColumnFilters([]);
                  setSorting([{ id: 'createdAt', desc: true }]);
                }}
              />
              {query.isLoading && <Skeleton className="h-32 w-full" />}
              {query.isError && (
                <p className="text-sm text-destructive">
                  문의 목록을 불러오지 못했습니다.
                </p>
              )}
              {!query.isLoading && !query.isError && (
                <DataGrid table={table} hasMore={query.hasNextPage} onScrollEnd={async () => { await query.fetchNextPage(); }} onRowClick={(row) => void openModal(QnaDetailModal, { item: row.original })} />
              )}
            </SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}

function QnaTools({ item, onDelete }: { item: QnaItem, onDelete: (item: QnaItem) => void | Promise<void> }) {
  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger render={(props) => (
          <Button {...props} type="button" variant="ghost" size="icon" aria-label="도구">
            <MoreHorizontal className="size-4" />
          </Button>
        )}
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void openModal(QnaDetailModal, { item })}>
            <Eye className="size-4" />
            보기
          </DropdownMenuItem>
          {item.status === 'open' && (
            <DropdownMenuItem variant="destructive" onClick={() => void onDelete(item)}>
              <Trash2 className="size-4" />
              삭제
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function filterOption<T extends string>(filters: ColumnFiltersState, id: string, options: readonly { value: T }[]): T | undefined {
  const value = filters.find((filter) => filter.id === id)?.value;
  return Array.isArray(value) ? options.find((option) => option.value === value[0])?.value : undefined;
}
