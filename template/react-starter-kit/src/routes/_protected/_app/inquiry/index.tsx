import { when, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { Row } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getInquiriesControllerGetInquiriesQueryKey, getInquiriesControllerGetInquiryQueryKey, useInquiriesControllerDeleteInquiry, useInquiriesControllerGetInquiries, useInquiriesControllerGetInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import type { InquiriesControllerGetInquiriesParams, InquiriesControllerGetInquiriesSortItem, InquiryItemDto, InquiryStatus } from '#/.generated/api/model';
import { Button, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { openDialog } from '#/components/dialog';
import { PageSection, SectionCard } from '#/components/layout';
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

  const handleSelectInquiry = useCallback((inquiry: InquiryItemDto) => {
    void openDialog(
      UserInquiryChatDialog,
      {
        inquiry,
        onStatusChange: () => {
          void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiriesQueryKey() });
          if (inquiry.id) {
            void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiryQueryKey(inquiry.id) });
          }
        },
      },
      { dialogId: `inquiry-${inquiry.id}` },
    );
  }, [queryClient]);

  const deleteMutation = useInquiriesControllerDeleteInquiry();

  const handleDelete = useCallback(async (inquiry: InquiryItemDto) => {
    const ok = await confirm({
      title: t('inquiry.deleteConfirmTitle'),
      description: t('inquiry.deleteConfirmDescription'),
      confirmLabel: t('inquiry.deleteInquiry'),
      cancelLabel: t('app.dialog.cancel'),
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
      onSelectInquiry: handleSelectInquiry,
      onDeleteInquiry: (inquiry) => void handleDelete(inquiry),
    }),
    [handleDelete, handleSelectInquiry, i18n],
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

  const queryParams = useMemo<InquiriesControllerGetInquiriesParams>(() => {
    const state = table.getState();
    const sort = (state.sorting[0]?.id ?? 'createdAt') as InquiriesControllerGetInquiriesSortItem;
    const direction = state.sorting[0]?.desc ? 'desc' : 'asc';

    return {
      page: state.pagination.pageIndex + 1,
      limit: state.pagination.pageSize,
      search: when((value): value is string => typeof value === 'string', (search) => search || undefined)(state.globalFilter),
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

  // URL search inquiryId 지원
  useEffect(() => {
    if (inquiryId && routeInquiryData) {
      handleSelectInquiry(routeInquiryData);
    }
  }, [inquiryId, routeInquiryData, handleSelectInquiry]);

  const handleCreateInquiry = useCallback(async () => {
    const isCreated = await openDialog(InquiryCreateDialog, undefined, { dialogId: 'inquiry-create' });
    if (isCreated) {
      void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetInquiriesQueryKey() });
    }
  }, [queryClient]);

  return (
    <PageSection
      icon="life-buoy"
      title={t('inquiry.pageTitle')}
      description={t('inquiry.pageDescription')}
    >
      {canCreateInquiry && (
        <PageSection.Actions>
          <Button type="button" onClick={() => void handleCreateInquiry()}>
            {t('inquiry.newInquiry')}
          </Button>
        </PageSection.Actions>
      )}
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
            <TabsTrigger value="all">{t('inquiry.tabAll')}</TabsTrigger>
            <TabsTrigger value="pending">{t('inquiry.tabPending')}</TabsTrigger>
            <TabsTrigger value="answered">{t('inquiry.tabAnswered')}</TabsTrigger>
            <TabsTrigger value="closed">{t('inquiry.tabClosed')}</TabsTrigger>
          </TabsList>
        </Tabs>

        <SectionCard
          textSize="sm"
          title={t('inquiry.listTitle')}
          description={t('inquiry.totalCount', { count: data?.totalCount ?? 0 })}
        >
          <SectionCard.Content className="grid h-full grid-rows-[auto_1fr_auto]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('inquiry.searchPlaceholder')}
              onReset={() => {
                table.setPageIndex(0);
                table.resetGlobalFilter();
                setStatusTab('all');
                table.resetSorting();
              }}
            />
            <DataGrid
              table={table}
              onRowClick={(row: Row<InquiryItemDto>) => handleSelectInquiry(row.original)}
            />
            <DataTablePagination table={table} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
