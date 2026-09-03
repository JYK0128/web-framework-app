import { when, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import type { Row } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getInquiriesControllerGetAdminInquiriesQueryKey, getInquiriesControllerGetAdminInquiryQueryKey, useInquiriesControllerDeleteAdminInquiry, useInquiriesControllerGetAdminInquiries, useInquiriesControllerGetAdminInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import type { InquiriesControllerGetAdminInquiriesParams, InquiriesControllerGetAdminInquiriesSortItem, InquiryItemDto, InquiryStatus } from '#/.generated/api/model';
import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { openDialog, PageSection, SectionCard } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';
import { AdminInquiryChatDialog } from '#/routes/_protected/_app/inquiry/-components/admin-inquiry-chat-dialog';

import { createInquiryManagementColumns } from './-configs/inquiry-management-columns.config';

export const Route = createFileRoute('/_protected/_app/inquiry-management/')({
  validateSearch: z.object({
    inquiryId: z.string().optional(),
  }),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'inquiry:manage')) throw notFound({ routeId: Route.id });
  },
  component: InquiryManagementPageComponent,
});

function InquiryManagementPageComponent() {
  const { inquiryId } = Route.useSearch();
  const { i18n, t } = useI18n();
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<'all' | InquiryStatus>('all');

  const handleSelectInquiry = useCallback((inquiry: InquiryItemDto) => {
    void openDialog(
      AdminInquiryChatDialog,
      {
        inquiry,
        onStatusChange: () => {
          void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiriesQueryKey() });
          if (inquiry.id) {
            void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiryQueryKey(inquiry.id) });
          }
        },
      },
      { dialogId: `admin-inquiry-${inquiry.id}` },
    );
  }, [queryClient]);

  const deleteMutation = useInquiriesControllerDeleteAdminInquiry();

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
        await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiriesQueryKey() });
      }
      catch {
        // Handled globally
      }
    }
  }, [deleteMutation, queryClient, t]);

  const columns = useMemo(
    () => createInquiryManagementColumns({ i18n, onSelectInquiry: handleSelectInquiry, onDeleteInquiry: (inquiry) => void handleDelete(inquiry) }),
    [handleDelete, handleSelectInquiry, i18n],
  );

  const table = useDataGrid({
    client: false,
    data: [],
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: 'createdAt', desc: true }],
    },
    getRowId: (row) => row.id,
  });

  const { data: routeInquiryData } = useInquiriesControllerGetAdminInquiry(inquiryId ?? '', {
    query: { enabled: Boolean(inquiryId) },
  });

  const activeInquiry = selectedInquiry ?? (inquiryId ? (routeInquiryData ?? null) : null);

  const queryParams = useMemo<InquiriesControllerGetAdminInquiriesParams>(() => {
    const tableState = table.getState();
    const sort = (tableState.sorting[0]?.id ?? 'createdAt') as InquiriesControllerGetAdminInquiriesSortItem;
    const direction = (tableState.sorting[0]?.desc ? 'desc' : 'asc');

    return {
      page: tableState.pagination.pageIndex + 1,
      limit: tableState.pagination.pageSize,
      search: when((value): value is string => typeof value === 'string', (search) => search || undefined)(tableState.globalFilter),
      status: valueIf(statusTab !== 'all', statusTab),
      sort: [sort],
      direction: [direction],
    };
  }, [statusTab, table]);

  const { data } = useInquiriesControllerGetAdminInquiries(queryParams);
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

  return (
    <PageSection icon="clipboard-list" title={t('inquiries.managementTitle')} description={t('inquiries.managementDescription')}>
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-6 p-2
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
          title={t('inquiries.managementListTitle')}
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
            <div className="flex-1">
              <DataGrid
                table={table}
                onRowClick={(row: Row<InquiryItemDto>) => handleSelectInquiry(row.original)}
              />
            </div>
            <DataTablePagination table={table} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
