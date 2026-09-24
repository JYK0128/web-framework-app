import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { qnaControllerListV1, useQnaControllerRemoveV1 } from '#/.generated/api/endpoints/qna/qna';
import type { QnaControllerListV1Params, QnaItem } from '#/.generated/api/model';
import { Button, Input, Skeleton } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';

import { QnaCreateModal } from './-components/qna-create-modal';
import { QnaDetailModal } from './-components/qna-detail-modal';

export const Route = createFileRoute('/_app/_protected/qna/')({ component: QnaPage });

const statusLabels = { open: '접수', in_progress: '처리 중', answered: '답변 완료', closed: '종료' } as const;
const categoryOptions = [{ label: '계정', value: '계정' }, { label: '서비스 이용', value: '서비스 이용' }, { label: '검증', value: '검증' }] as const;
const statusOptions = [{ label: '접수', value: 'open' }, { label: '처리 중', value: 'in_progress' }, { label: '답변 완료', value: 'answered' }, { label: '종료', value: 'closed' }] as const;
const priorityOptions = [{ label: '낮음', value: 'low' }, { label: '보통', value: 'normal' }, { label: '높음', value: 'high' }, { label: '긴급', value: 'urgent' }] as const;

function QnaPage() {
  const queryClient = useQueryClient();
  const [draftFilters, setDraftFilters] = useState({ search: '', category: '', status: '', priority: '' });
  const [filters, setFilters] = useState(draftFilters);
  const queryParams = useMemo(() => ({
    limit: 20,
    search: filters.search || undefined,
    category: filters.category || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
  }), [filters]);
  const query = useInfiniteQuery({
    queryKey: ['service-qna-list', queryParams],
    queryFn: ({ pageParam, signal }) => qnaControllerListV1({ ...queryParams, page: pageParam } as QnaControllerListV1Params, undefined, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.data.hasNextPage ? lastPage.data.page + 1 : undefined,
  });
  const remove = useQnaControllerRemoveV1();
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.data.items) ?? [], [query.data]);

  const handleSearch = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setFilters(draftFilters);
  };
  const handleDelete = useCallback(async (item: QnaItem) => {
    if (!await confirm({ title: '문의 삭제', description: `“${item.title}” 문의를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await remove.mutateAsync({ id: item.id });
    await queryClient.invalidateQueries({ queryKey: ['service-qna-list'] });
  }, [queryClient, remove]);
  const columns = useMemo(() => {
    const helper = createColumnHelper<QnaItem>();
    return [
      helper.accessor('category', { header: '분류' }),
      helper.accessor('title', {
        header: '제목',
        cell: (context) => (
          <span className="font-medium">
            {context.getValue()}
          </span>
        ),
      }),
      helper.accessor('status', { header: '상태', cell: (context) => statusLabels[context.getValue()] }),
      helper.accessor('priority', { header: '우선순위', cell: (context) => priorityOptions.find((option) => option.value === context.getValue())?.label }),
      helper.accessor('createdAt', { header: '등록일', cell: (context) => new Date(context.getValue()).toLocaleDateString('ko-KR') }),
      helper.display({
        id: 'tools',
        header: '도구',
        size: 120,
        cell: (context) => <QnaTools item={context.row.original} onDelete={handleDelete} />,
      }),
    ];
  }, [handleDelete]);
  const table = useDataGrid({
    client: false,
    cursor: true,
    data: items,
    columns,
    getRowId: (row) => row.id,
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
          mx-auto grid size-full min-w-0 max-w-5xl grid-rows-[minmax(0,1fr)]
          gap-6 pt-2
        "
        >
          <SectionCard textSize="sm" title="내 문의" description="등록한 문의의 처리 상태와 답변을 확인합니다.">
            <SectionCard.Content className="
              grid h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3
              overflow-hidden p-4
            "
            >
              <form
                className="
                  grid gap-2
                  sm:grid-cols-[minmax(0,1fr)_9rem_9rem_9rem_auto]
                "
                onSubmit={handleSearch}
              >
                <Input value={draftFilters.search} placeholder="제목 또는 내용 검색" onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} />
                <select
                  className="
                    h-8 rounded-lg border border-input bg-transparent px-2.5
                    text-sm
                  "
                  value={draftFilters.category}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value="">전체 분류</option>
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select
                  className="
                    h-8 rounded-lg border border-input bg-transparent px-2.5
                    text-sm
                  "
                  value={draftFilters.status}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="">전체 상태</option>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select
                  className="
                    h-8 rounded-lg border border-input bg-transparent px-2.5
                    text-sm
                  "
                  value={draftFilters.priority}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, priority: event.target.value }))}
                >
                  <option value="">전체 우선순위</option>
                  {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <Button type="submit" variant="outline">검색</Button>
              </form>
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
    <details className="relative flex justify-end" onClick={(event) => event.stopPropagation()}>
      <summary className="list-none">
        <Button type="button" variant="ghost" size="icon" aria-label="도구">
          <MoreHorizontal className="size-4" />
        </Button>
      </summary>
      <div className="
        absolute right-0 z-30 mt-1 grid min-w-24 gap-1 rounded-md border
        bg-popover p-1 text-popover-foreground shadow-md
      "
      >
        <Button type="button" variant="ghost" className="justify-start" onClick={() => void openModal(QnaDetailModal, { item })}>보기</Button>
        {item.status === 'open' && (
          <Button
            type="button"
            variant="ghost"
            className="
              justify-start text-destructive
              hover:text-destructive
            "
            onClick={() => void onDelete(item)}
          >
            <Trash2 className="size-4" />
            삭제
          </Button>
        )}
      </div>
    </details>
  );
}
