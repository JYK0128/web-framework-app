import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { getFaqsControllerListFaqsV1QueryKey, useFaqsControllerDeleteFaqV1, useFaqsControllerListFaqsV1 } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { authUserAtom } from '#/store/auth';

import { FaqEditorModal } from './-components/faq-editor-modal';

export const Route = createFileRoute('/_protected/_app/faqs/')({ component: FaqManagementPage });

const columnHelper = createColumnHelper<FaqItemDto>();

function FaqManagementPage() {
  const user = useAtomValue(authUserAtom);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const query = useFaqsControllerListFaqsV1({
    page,
    limit: 20,
    search: search.trim() || undefined,
  });
  const canCreate = user?.permissions.includes('faq:create') ?? false;
  const canUpdate = user?.permissions.includes('faq:update') ?? false;
  const canDelete = user?.permissions.includes('faq:delete') ?? false;
  const deleteMutation = useFaqsControllerDeleteFaqV1();
  const openEditor = useCallback((faq?: FaqItemDto) => {
    void openModal(FaqEditorModal, { faq });
  }, []);
  const handleDelete = useCallback(async (faq: FaqItemDto) => {
    if (!await confirm({ title: 'FAQ 삭제', description: `“${faq.question}” FAQ를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await deleteMutation.mutateAsync({ id: faq.id });
    await queryClient.invalidateQueries({ queryKey: getFaqsControllerListFaqsV1QueryKey() });
  }, [deleteMutation, queryClient]);
  const response = query.data?.data;
  const table = useDataGrid({
    client: false,
    data: response?.items ?? [],
    columns: [
      columnHelper.accessor('category', { header: '카테고리' }),
      columnHelper.accessor('question', { header: '질문' }),
      columnHelper.accessor('isPublished', { header: '상태', cell: ({ getValue }) => getValue() ? '게시됨' : '비게시' }),
      columnHelper.accessor('sortOrder', { header: '순서' }),
      columnHelper.accessor('updatedAt', { header: '수정일', cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString('ko-KR') }),
      columnHelper.display({
        id: 'tools',
        header: '관리',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            {canUpdate && (
              <Button type="button" variant="ghost" size="icon" aria-label="FAQ 수정" onClick={() => openEditor(row.original)}>
                <Pencil className="size-4" />
              </Button>
            )}
            {canDelete && (
              <Button type="button" variant="ghost" size="icon" aria-label="FAQ 삭제" onClick={() => void handleDelete(row.original)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
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
    <PageSection icon="circle-help" title="FAQ 관리" description="서비스에 공개되는 FAQ를 확인합니다.">
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] gap-6 p-2">
        <SectionCard textSize="sm" title="FAQ 목록" description="게시된 FAQ와 비게시 FAQ를 함께 확인할 수 있습니다.">
          {canCreate && (
            <SectionCard.Actions>
              <Button type="button" onClick={() => openEditor()}>
                <Plus className="size-4" />
                FAQ 추가
              </Button>
            </SectionCard.Actions>
          )}
          <SectionCard.Content className="
            grid h-full grid-rows-[auto_minmax(0,1fr)_auto]
          "
          >
            <DataGridToolbar
              table={table}
              searchPlaceholder="질문 또는 답변 검색..."
              onReset={() => {
                setPage(1);
                setSearch('');
              }}
            />
            <DataGrid table={table} />
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
