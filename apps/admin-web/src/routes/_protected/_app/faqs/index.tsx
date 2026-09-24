import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { getFaqsControllerListFaqsV1QueryKey, useFaqsControllerDeleteFaqV1, useFaqsControllerListFaqsV1 } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { PermissionGate } from '#/components/auth/permission-gate';
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
  const deleteMutation = useFaqsControllerDeleteFaqV1();
  const openEditor = useCallback((faq?: FaqItemDto) => {
    void openModal(FaqEditorModal, { faq });
  }, []);
  const openDetail = useCallback((faq: FaqItemDto) => {
    void openModal(FaqEditorModal, { faq, readOnly: true });
  }, []);
  const handleDelete = useCallback(async (faq: FaqItemDto) => {
    if (!await confirm({ title: 'FAQ 삭제', description: `“${faq.question}” FAQ를 삭제하시겠습니까?`, tone: 'danger' })) return;
    await deleteMutation.mutateAsync({ id: faq.id });
    await queryClient.invalidateQueries({ queryKey: getFaqsControllerListFaqsV1QueryKey() });
  }, [deleteMutation, queryClient]);
  const response = query.data?.data;
  const table = useDataGrid({
    client: true,
    data: response?.items ?? [],
    columns: [
      columnHelper.accessor('category', { header: '카테고리' }),
      columnHelper.accessor('question', { header: '질문' }),
      columnHelper.accessor('isPublished', {
        header: '상태',
        enableColumnFilter: true,
        meta: {
          filterType: 'faceted',
          filterMultiple: false,
          filterOptions: [
            { label: '게시됨', value: 'true' },
            { label: '비게시', value: 'false' },
          ],
        },
        filterFn: (row, id, value) => !Array.isArray(value) || value.length === 0 || String(row.getValue(id)) === value[0],
        cell: ({ getValue }) => <StatusText tone={getValue() ? 'success' : 'neutral'}>{getValue() ? '게시됨' : '비게시'}</StatusText>,
      }),
      columnHelper.accessor('sortOrder', { header: '순서' }),
      columnHelper.accessor('updatedAt', { header: '수정일', cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString('ko-KR') }),
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
                    수정
                  </DropdownMenuItem>
                )}
                {canUpdate && <DropdownMenuSeparator />}
                <PermissionGate permission="faq:delete">
                  <DropdownMenuItem variant="destructive" onClick={() => void handleDelete(row.original)}>
                    <Trash2 className="size-4" />
                    삭제
                  </DropdownMenuItem>
                </PermissionGate>
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
    <PageSection icon="circle-help" title="FAQ 관리" description="서비스에 공개되는 FAQ를 확인합니다.">
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] gap-6 p-2">
        <SectionCard textSize="sm" title="FAQ 목록" description="게시된 FAQ와 비게시 FAQ를 함께 확인할 수 있습니다.">
          {canCreate && (
            <SectionCard.Actions>
              <Button type="button" variant="outline" onClick={() => openEditor()}>
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

function StatusText({ children, tone }: { children: string, tone: 'neutral' | 'success' }) {
  return (
    <span className={tone === 'success'
      ? `
        font-semibold text-emerald-600
        dark:text-emerald-400
      `
      : 'font-semibold text-muted-foreground'}
    >
      {children}
    </span>
  );
}
