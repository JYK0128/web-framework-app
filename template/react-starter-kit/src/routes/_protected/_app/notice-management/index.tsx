import { valueIf, when } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

import { getNoticesControllerGetAdminNoticesQueryKey, useNoticesControllerDeleteNotice, useNoticesControllerGetAdminNotices } from '#/.generated/api/endpoints/notices/notices';
import type { NoticeItemDto, NoticesControllerGetAdminNoticesParams } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { openDialog, PageSection, SectionCard } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { NoticeCreateDialog } from './-components/notice-create-dialog';
import { NoticeUpdateDialog } from './-components/notice-update-dialog';
import { createNoticeManagementColumns } from './-configs/notice-management-columns.config';

export const Route = createFileRoute('/_protected/_app/notice-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'notice:manage')) throw notFound({ routeId: Route.id });
  },
  component: NoticesPageComponent,
});

function NoticesPageComponent() {
  const { i18n, t } = useI18n();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const handleEditNotice = useCallback((notice: NoticeItemDto) => {
    void openDialog(NoticeUpdateDialog, { notice }, { dialogId: `notice-edit-${notice.id}` });
  }, []);

  const canUpdate = hasPermission(user.permissions, 'notice:update');
  const canDelete = hasPermission(user.permissions, 'notice:delete');
  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: getNoticesControllerGetAdminNoticesQueryKey() }), [queryClient]);
  const deleteMutation = useNoticesControllerDeleteNotice();

  const handleDelete = useCallback(async (notice: NoticeItemDto) => {
    const isConfirmed = await confirm({
      description: t('notices.deleteConfirm'),
      tone: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync({ id: notice.id });
      await invalidate();
    }
    catch {
      return;
    }
  }, [deleteMutation, invalidate, t]);

  const columns = useMemo(
    () => createNoticeManagementColumns({
      i18n,
      canUpdate,
      canDelete,
      onEdit: handleEditNotice,
      onDelete: (notice) => void handleDelete(notice),
    }),
    [canDelete, canUpdate, handleDelete, handleEditNotice, i18n],
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

  const queryParams = useMemo<NoticesControllerGetAdminNoticesParams>(() => {
    const state = table.getState();
    const sorting = state.sorting.filter(({ id }) => id !== 'status' && id !== 'actions');
    return {
      page: state.pagination.pageIndex + 1,
      limit: state.pagination.pageSize,
      search: when((value): value is string => typeof value === 'string', (search) => search || undefined)(state.globalFilter),
      sort: (sorting.length > 0 ? sorting : [{ id: 'createdAt', desc: true }]).map(({ id }) => id),
      direction: (sorting.length > 0 ? sorting : [{ id: 'createdAt', desc: true }]).map(({ desc }) => desc ? 'desc' : 'asc'),
    };
  }, [table]);

  const { data } = useNoticesControllerGetAdminNotices(queryParams);
  const notices = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const canCreate = hasPermission(user.permissions, 'notice:create');

  table.setOptions((options) => ({
    ...options,
    data: notices,
    rowCount: totalCount,
    pageCount: totalPages,
    defaultColumn: { size: 140 },
  }));

  const handleCreateNotice = useCallback(async () => {
    const isCreated = await openDialog(NoticeCreateDialog, undefined, { dialogId: 'notice-create' });
    if (isCreated) {
      void invalidate();
    }
  }, [invalidate]);

  return (
    <PageSection
      icon="megaphone"
      title={t('notices.pageTitle')}
      description={t('notices.description')}
    >
      {canCreate && (
        <PageSection.Actions>
          <Button type="button" onClick={() => void handleCreateNotice()}>
            {t('notices.create')}
          </Button>
        </PageSection.Actions>
      )}
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <SectionCard textSize="base" title={t('notices.listTitle')} description={t('notices.listDescription')}>
          <SectionCard.Content className="grid h-full grid-rows-[auto_1fr_auto]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('notices.searchPlaceholder')}
              onReset={() => {
                table.setPageIndex(0);
                table.resetGlobalFilter();
                table.resetSorting();
              }}
            />
            <DataGrid
              table={table}
              onRowClick={(row) => {
                handleEditNotice(row.original);
              }}
            />
            <DataTablePagination table={table} rowCount={totalCount} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
