import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { Row } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

import { getInquiriesControllerGetInquiriesQueryKey, getInquiriesControllerGetInquiryQueryKey, useInquiriesControllerDeleteInquiry, useInquiriesControllerGetInquiries, useInquiriesControllerGetInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import type { InquiriesControllerGetInquiriesParams, InquiriesControllerGetInquiriesSortItem, InquiryItemDto, InquiryStatus } from '#/.generated/api/model';
import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { InquiryCreateDialog } from './-components/inquiry-create-dialog';
import { UserInquiryChatDialog } from './-components/user-inquiry-chat-dialog';
import { createInquiryColumns } from './-configs/inquiry-columns.config';

export const Route = createFileRoute('/_protected/_app/inquiry/')({
  validateSearch: z.object({
    inquiryId: z.string().optional(),
  }),
  component: InquiriesPageComponent,
});

function InquiriesPageComponent() {
  const { user } = Route.useRouteContext();
  const { inquiryId } = Route.useSearch();
  const { i18n, t } = useI18n();
  const queryClient = useQueryClient();
  const canCreateInquiry = hasPermission(user.permissions, 'inquiry:create');

  const [statusTab, setStatusTab] = useState<'all' | InquiryStatus>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItemDto | null>(null);

  const deleteMutation = useInquiriesControllerDeleteInquiry();

  const handleDelete = useCallback(async (inquiry: InquiryItemDto) => {
    const ok = await confirm({
      title: t('inquiries.deleteConfirmTitle'),
      description: t('inquiries.deleteConfirmDescription'),
      confirmLabel: t('inquiries.deleteInquiry'),
      cancelLabel: t('inquiries.cancel'),
      tone: 'danger',
    });

    if (ok) {
      try {
        await deleteMutation.mutateAsync({ id: inquiry.id });
        await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiriesQueryKey() });
      }
      catch {
        // Handled globally
      }
    }
  }, [deleteMutation, queryClient, t]);

  const columns = useMemo(
    () => createInquiryColumns({
      i18n,
      onSelectInquiry: setSelectedInquiry,
      onDeleteInquiry: (inquiry) => void handleDelete(inquiry),
    }),
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
      sorting: [{ id: 'createdAt', desc: true }],
    },
    getRowId: (row) => row.id,
  });

  const { data: routeInquiryData } = useInquiriesControllerGetInquiry(inquiryId ?? '', {
    query: { enabled: Boolean(inquiryId) },
  });

  const activeInquiry = selectedInquiry ?? (inquiryId ? (routeInquiryData ?? null) : null);

  const queryParams = useMemo<InquiriesControllerGetInquiriesParams>(() => {
    const state = table.getState();
    const sort = (state.sorting[0]?.id ?? 'createdAt') as InquiriesControllerGetInquiriesSortItem;
    const direction = state.sorting[0]?.desc ? 'desc' : 'asc';

    return {
      page: state.pagination.pageIndex + 1,
      limit: state.pagination.pageSize,
      search: typeof state.globalFilter === 'string' ? state.globalFilter || undefined : undefined,
      status: statusTab === 'all' ? undefined : statusTab,
      sort: [sort],
      direction: [direction],
    };
  }, [statusTab, table]);

  const { data } = useInquiriesControllerGetInquiries(queryParams);
  const inquiries = useMemo(() => data?.items ?? [], [data?.items]);

  table.setOptions((options) => ({
    ...options,
    data: inquiries,
    rowCount: data?.totalCount ?? 0,
    pageCount: data?.totalPages ?? 1,
  }));

  const handleDialogStatusChange = useCallback((status: InquiryStatus) => {
    setSelectedInquiry((prev) => (prev ? { ...prev, status } : prev));
    void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiriesQueryKey() });
    if (inquiryId) {
      void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiryQueryKey(inquiryId) });
    }
  }, [inquiryId, queryClient]);

  return (
    <PageSection icon="life-buoy" title={t('inquiries.pageTitle')} description={t('inquiries.pageDescription')}>
      {canCreateInquiry && <PageSection.Actions><InquiryCreateDialog /></PageSection.Actions>}
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-2 p-2
      "
      >
        <Tabs
          value={statusTab}
          onValueChange={(val) => {
            setStatusTab(val as 'all' | InquiryStatus);
            table.setPageIndex(0);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="all">{t('inquiries.tabAll')}</TabsTrigger>
            <TabsTrigger value="pending">{t('inquiries.tabPending')}</TabsTrigger>
            <TabsTrigger value="answered">{t('inquiries.tabAnswered')}</TabsTrigger>
            <TabsTrigger value="closed">{t('inquiries.tabClosed')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <SectionCard
          textSize="sm"
          title={t('inquiries.listTitle')}
          description={t('inquiries.totalCount', { count: data?.totalCount ?? 0 })}
        >
          <SectionCard.Content className="grid h-full grid-rows-[auto_1fr_auto]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('inquiries.searchPlaceholder')}
              onReset={() => {
                table.setPageIndex(0);
                table.resetGlobalFilter();
                setStatusTab('all');
                table.resetSorting();
              }}
            />
            <DataGrid
              table={table}
              onRowClick={(row: Row<InquiryItemDto>) => setSelectedInquiry(row.original)}
            />
            <DataTablePagination table={table} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
      <PageSection.Dialogs>
        {activeInquiry && (
          <UserInquiryChatDialog
            key={activeInquiry.id}
            inquiry={activeInquiry}
            onStatusChange={handleDialogStatusChange}
          />
        )}
      </PageSection.Dialogs>
    </PageSection>
  );
}
