import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { Row } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo } from 'react';

import { getSupportControllerGetSupportTicketsQueryKey, useSupportControllerDeleteSupportTicket, useSupportControllerGetSupportTicket, useSupportControllerGetSupportTickets } from '#/.generated/api/endpoints/support/support';
import type { SortDirection, SupportControllerGetSupportTicketsParams, SupportControllerGetSupportTicketsSortItem, SupportTicketItemDto } from '#/.generated/api/model';
import { Button, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { openModal } from '#/components/modal';
import { PageSection, SectionCard } from '#/components/layout';
import { DATA_GRID_PAGE_SIZE } from '#/configs/list.config';
import { useHashTab, useI18n } from '#/hooks';

import { SupportTicketCreateDialog } from './-components/support-ticket-create-dialog';
import { SupportTicketDetailDialog } from './-components/support-ticket-detail-dialog';
import { createSupportTicketColumns } from './-configs/support-ticket-columns.config';

const SUPPORT_STATUS_TABS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;
type SupportStatusTab = typeof SUPPORT_STATUS_TABS[number];

export const Route = createFileRoute('/_protected/_app/support/')({
  validateSearch: (search) => ({ ticketId: typeof search.ticketId === 'string' ? search.ticketId : undefined }),
  component: SupportPageComponent,
});

function SupportPageComponent() {
  const { ticketId } = Route.useSearch();
  const { i18n, t } = useI18n();
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useHashTab<SupportStatusTab>(SUPPORT_STATUS_TABS, 'all');

  const handleSelectTicket = useCallback((ticket: SupportTicketItemDto) => {
    void openModal(
      SupportTicketDetailDialog,
      { ticket },
      { modalId: `support-ticket-${ticket.id}` },
    );
  }, []);

  const deleteMutation = useSupportControllerDeleteSupportTicket();
  const handleDelete = useCallback(async (ticket: SupportTicketItemDto) => {
    const ok = await confirm({
      title: t('support.deleteConfirmTitle'),
      description: t('support.deleteConfirmDescription'),
      confirmLabel: t('support.deleteTicket'),
      cancelLabel: t('app.dialog.cancel'),
      tone: 'danger',
    });

    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ id: ticket.id });
      await queryClient.invalidateQueries({ queryKey: getSupportControllerGetSupportTicketsQueryKey() });
    }
    catch {
      // Handled by the global mutation error handler.
    }
  }, [deleteMutation, queryClient, t]);

  const columns = useMemo(
    () => createSupportTicketColumns({ i18n, onSelect: handleSelectTicket, onDelete: (ticket) => void handleDelete(ticket) }),
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

  const queryParams: SupportControllerGetSupportTicketsParams = (() => {
    const tableState = table.getState();
    const sort = (tableState.sorting[0]?.id ?? 'createdAt') as SupportControllerGetSupportTicketsSortItem;
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

  const { data, isLoading } = useSupportControllerGetSupportTickets(queryParams);
  const { data: routeTicketData } = useSupportControllerGetSupportTicket(ticketId ?? '', {
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

  const handleCreate = useCallback(async () => {
    const created = await openModal(SupportTicketCreateDialog, undefined, { modalId: 'support-ticket-create' });
    if (created) await queryClient.invalidateQueries({ queryKey: getSupportControllerGetSupportTicketsQueryKey() });
  }, [queryClient]);

  return (
    <PageSection icon="life-buoy" title={t('support.pageTitle')} description={t('support.pageDescription')} isLoading={isLoading}>
      <PageSection.Actions>
        <Button type="button" onClick={() => void handleCreate()}>{t('support.newTicket')}</Button>
      </PageSection.Actions>
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-2 p-2
      "
      >
        <Tabs
          value={statusTab}
          onValueChange={(value) => {
            setStatusTab(value as SupportStatusTab);
            table.setPageIndex(0);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 max-w-xl">
            <TabsTrigger value="all">{t('support.tabs.all')}</TabsTrigger>
            <TabsTrigger value="open">{t('support.tabs.open')}</TabsTrigger>
            <TabsTrigger value="in_progress">{t('support.tabs.inProgress')}</TabsTrigger>
            <TabsTrigger value="resolved">{t('support.tabs.resolved')}</TabsTrigger>
            <TabsTrigger value="closed">{t('support.tabs.closed')}</TabsTrigger>
          </TabsList>
        </Tabs>
        <SectionCard textSize="sm" title={t('support.listTitle')} description={t('support.totalCount', { count: data?.totalCount ?? 0 })}>
          <SectionCard.Content className="grid h-full grid-rows-[auto_1fr_auto]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('support.searchPlaceholder')}
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
