import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';

import { getFaqsControllerGetAdminFaqsQueryKey, getFaqsControllerGetFaqsQueryKey, useFaqsControllerDeleteFaq, useFaqsControllerGetAdminFaqs } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto, FaqsControllerGetAdminFaqsParams, FaqsControllerGetAdminFaqsSortItem, SortDirection } from '#/.generated/api/model';
import { PageSection } from '#/components/app';
import { SectionCard } from '#/components/app/section-card';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';

import { FaqCreateDialog } from './-components/faq-create-dialog';
import { FaqUpdateDialog } from './-components/faq-update-dialog';
import { getFaqManagementCategoryList } from './-configs/faq.config';
import { createFaqManagementColumns } from './-configs/faq-management-columns.config';

export const Route = createFileRoute('/_protected/_app/faq-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'faq:manage')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: FaqManagementPageComponent,
});

function FaqManagementPageComponent() {
  const { i18n, t } = useI18n();
  const queryClient = useQueryClient();
  const deleteMutation = useFaqsControllerDeleteFaq();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [selectedFaq, setSelectedFaq] = useState<FaqItemDto | null>(null);

  const handleDelete = useCallback(async (faq: FaqItemDto) => {
    const isConfirmed = await confirm({
      title: t('faq.deleteConfirmTitle'),
      description: t('faq.deleteConfirmDescription'),
      tone: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync({ id: faq.id });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetAdminFaqsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetFaqsQueryKey() });
    }
    catch {
      return;
    }
  }, [deleteMutation, queryClient, t]);

  const categoryList = useMemo(() => getFaqManagementCategoryList(t), [t]);

  const columns = useMemo(
    () => createFaqManagementColumns({ i18n, onEdit: setSelectedFaq, onDelete: (faq) => void handleDelete(faq) }),
    [handleDelete, i18n],
  );

  const table = useDataGrid({
    client: false,
    data: [],
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: 'order', desc: false }],
    },
    getRowId: (row) => row.id,
  });

  const queryParams = useMemo<FaqsControllerGetAdminFaqsParams>(() => {
    const tableState = table.getState();
    const sort: FaqsControllerGetAdminFaqsSortItem[] = tableState.sorting.length > 0
      ? tableState.sorting.map((s) => s.id as FaqsControllerGetAdminFaqsSortItem)
      : ['order'];
    const direction: SortDirection[] = tableState.sorting.length > 0
      ? tableState.sorting.map((s) => s.desc ? 'desc' : 'asc')
      : ['asc'];
    return {
      page: tableState.pagination.pageIndex + 1,
      limit: tableState.pagination.pageSize,
      search: typeof tableState.globalFilter === 'string' ? tableState.globalFilter || undefined : undefined,
      sort,
      direction,
      filters: selectedCategory !== 'all' ? { category: selectedCategory } : undefined,
    };
  }, [selectedCategory, table]);

  const { data } = useFaqsControllerGetAdminFaqs(queryParams);
  const faqs = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const publishedCount = useMemo(() => faqs.filter((f) => f.isPublished).length, [faqs]);

  table.setOptions((options) => ({
    ...options,
    data: faqs,
    rowCount: totalCount,
    pageCount: totalPages,
  }));

  return (
    <PageSection icon="message-square-quote" title={t('faq.managementTitle')} description={t('faq.managementDescription')}>
      <PageSection.Actions><FaqCreateDialog /></PageSection.Actions>
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <SectionCard
          textSize="base"
          title={t('faq.boardTitle')}
          description={(
            <>
              {t('faq.totalCount', { count: totalCount })}
              {' · '}
              <span className="text-emerald-600 font-medium">
                {t('faq.published')}
                {' '}
                {publishedCount}
              </span>
            </>
          )}
        >
          <SectionCard.Content>
            <div className="grid h-full grid-rows-[auto_auto_1fr_auto]">
              <div className="flex items-center gap-1.5 border-b px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {categoryList.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.key);
                          table.setPageIndex(0);
                        }}
                        className={`
                          h-8 whitespace-nowrap rounded-md px-3 text-xs
                          font-medium transition-all
                          ${isActive
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : `
                          bg-muted/70 text-muted-foreground
                          hover:bg-muted hover:text-foreground
                        `}
                        `}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <DataGridToolbar
                table={table}
                searchPlaceholder={t('faq.searchPlaceholder')}
                onReset={() => {
                  table.resetGlobalFilter();
                  table.setPageIndex(0);
                  setSelectedCategory('all');
                }}
              />
              <div className="flex-1">
                <DataGrid
                  table={table}
                  onRowClick={(row) => {
                    setSelectedFaq(row.original);
                  }}
                />
              </div>
              <DataTablePagination table={table} />
            </div>
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
      <PageSection.Dialogs>
        {selectedFaq && (
          <FaqUpdateDialog
            key={selectedFaq.id}
            faq={selectedFaq}
          />
        )}
      </PageSection.Dialogs>

    </PageSection>
  );
}
