import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import type { Row } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo } from 'react';

import { getSupportControllerGetAdminSupportTicketsQueryKey, useSupportControllerDeleteAdminSupportTicket, useSupportControllerGetAdminSupportTicket, useSupportControllerGetAdminSupportTickets } from '#/.generated/api/endpoints/support/support';
import type { SortDirection, SupportControllerGetAdminSupportTicketsParams, SupportControllerGetAdminSupportTicketsSortItem, SupportTicketItemDto } from '#/.generated/api/model';
import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { openDialog } from '#/components/dialog';
import { PageSection, SectionCard } from '#/components/layout';
import { DATA_GRID_PAGE_SIZE } from '#/configs/list.config';
import { hasPermission } from '#/core/auth/permissions';
import { useHashTab, useI18n } from '#/hooks';

import { SupportTicketManagementDialog } from './-components/support-ticket-management-dialog';
import { createSupportManagementColumns } from './-configs/support-management-columns.config';

const SUPPORT_MANAGEMENT_STATUS_TABS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;
type SupportManagementStatusTab = typeof SUPPORT_MANAGEMENT_STATUS_TABS[number];

export const Route = createFileRoute('/_protected/_app/support-management/')({
  validateSearch: (search) => ({ ticketId: typeof search.ticketId === 'string' ? search.ticketId : undefined }),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'support:manage')) throw notFound({ routeId: Route.id });
  },
  component: SupportManagementPageComponent,
});

function SupportManagementPageComponent() {
  const { ticketId } = Route.useSearch();
  const { i18n, t } = useI18n();
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useHashTab<SupportManagementStatusTab>(SUPPORT_MANAGEMENT_STATUS_TABS, 'all');

  const handleSelectTicket = useCallback((ticket: SupportTicketItemDto) => {
    void openDialog(
      SupportTicketManagementDialog,
      { ticket },
      { dialogId: `support-ticket-management-${ticket.id}` },
    );
  }, []);

  const deleteMutation = useSupportControllerDeleteAdminSupportTicket();
  const handleDelete = useCallback(async (ticket: SupportTicketItemDto) => {
    const ok = await confirm({
      title: t('supportManagement.deleteConfirmTitle'),
      description: t('supportManagement.deleteConfirmDescription'),
      confirmLabel: t('supportManagement.deleteTicket'),
      cancelLabel: t('app.dialog.cancel'),
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ id: ticket.id });
      await queryClient.invalidateQueries({ queryKey: getSupportControllerGetAdminSupportTicketsQueryKey() });
    }
    catch {
      // Handled by the global mutation error handler.
    }
  }, [deleteMutation, queryClient, t]);

  const columns = useMemo(
    () => createSupportManagementColumns({ i18n, onSelect: handleSelectTicket, onDelete: (ticket) => void handleDelete(ticket) }),
    [handleDelete, handleSelectTicket, i18n],
  );

  const table = useDataGrid({
    client: false,
    data: [],
    columns,
    enableColumnFilters: false,
    enablePinning: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: DATA_GRID_PAGE_SIZE },
      sorting: [{ id: 'createdAt', desc: true }],
    },
    getRowId: (row) => row.id,
  });

  const queryParams: SupportControllerGetAdminSupportTicketsParams = (() => {
    const tableState = table.getState();
    const sort = (tableState.sorting[0]?.id ?? 'createdAt') as SupportControllerGetAdminSupportTicketsSortItem;
    const direction: SortDirection = tableState.sorting[0]?.desc ? 'desc' : 'asc';
    return {
      page: tableState.pagination.pageIndex + 1,
      limit: tableState.pagination.pageSize,
      search: typeof tableState.globalFilter === 'string' ? tableState.globalFilter || undefined : undefined,
      status: statusTab === 'all' ? undefined : statusTab,
      sort: [sort],
      direction: [direction],
    };
  })();

  const { data, isLoading } = useSupportControllerGetAdminSupportTickets(queryParams);
  const { data: routeTicketData } = useSupportControllerGetAdminSupportTicket(ticketId ?? '', {
    query: { enabled: Boolean(ticketId) },
  });
  const tickets = useMemo(() => data?.items ?? [], [data?.items]);

  table.setOptions((options) => ({
    ...options,
    data: tickets,
    rowCount: data?.totalCount ?? 0,
    pageCount: data?.totalPages ?? 1,
  }));

  useEffect(() => {
    if (ticketId && routeTicketData) handleSelectTicket(routeTicketData);
  }, [handleSelectTicket, routeTicketData, ticketId]);

  return (
    <PageSection icon="clipboard-list" title={t('supportManagement.pageTitle')} description={t('supportManagement.pageDescription')} isLoading={isLoading}>
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-2 p-2
      "
      >
        <Tabs
          value={statusTab}
          onValueChange={(value) => {
            setStatusTab(value as SupportManagementStatusTab);
            table.setPageIndex(0);
          }}
          className="w-full"
        >
          <TabsList className="
            flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent
          "
          >
            <TabsTrigger value="all">{t('supportManagement.tabs.all')}</TabsTrigger>
            <TabsTrigger value="open">{t('supportManagement.tabs.open')}</TabsTrigger>
            <TabsTrigger value="in_progress">{t('supportManagement.tabs.inProgress')}</TabsTrigger>
            <TabsTrigger value="resolved">{t('supportManagement.tabs.resolved')}</TabsTrigger>
            <TabsTrigger value="closed">{t('supportManagement.tabs.closed')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <SectionCard textSize="sm" title={t('supportManagement.listTitle')} description={t('supportManagement.totalCount', { count: data?.totalCount ?? 0 })}>
          <SectionCard.Content className="grid h-full grid-rows-[auto_1fr_auto]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('supportManagement.searchPlaceholder')}
              onReset={() => {
                table.setPageIndex(0);
                table.resetGlobalFilter();
                table.resetSorting();
                setStatusTab('all');
              }}
            />
            <DataGrid table={table} onRowClick={(row: Row<SupportTicketItemDto>) => handleSelectTicket(row.original)} />
            <DataTablePagination table={table} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
