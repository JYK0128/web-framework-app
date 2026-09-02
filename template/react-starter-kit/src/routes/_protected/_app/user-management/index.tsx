import { createFileRoute, notFound } from '@tanstack/react-router';
import { UserX } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useUsersControllerGetUserOverview, useUsersControllerGetUsers } from '#/.generated/api/endpoints/users/users';
import type { UsersControllerGetUsersParams, UsersControllerGetUsersSortItem } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/app';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { UserManagementDialog } from './-components/user-management-dialog';
import { UserStatsCards } from './-components/user-stats-cards';
import { createUserColumns } from './-configs/user-columns.config';

export const Route = createFileRoute('/_protected/_app/user-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'user:manage')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: UsersPageComponent,
});

function UsersPageComponent() {
  const { i18n, t } = useI18n();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const columns = useMemo(
    () => createUserColumns({ i18n, onShowDetails: setSelectedUserId }),
    [i18n],
  );

  const table = useDataGrid({
    client: false,
    data: [],
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: 'createdAt', desc: true }],
      columnFilters: [{ id: 'includeDeleted', value: false }],
    },
  });

  const queryParams = useMemo<UsersControllerGetUsersParams>(() => {
    const tableState = table.getState();
    const includeDeleted = tableState.columnFilters.find((filter) => filter.id === 'includeDeleted')?.value === true;
    return {
      page: tableState.pagination.pageIndex + 1,
      limit: tableState.pagination.pageSize,
      search: typeof tableState.globalFilter === 'string' ? tableState.globalFilter || undefined : undefined,
      includeDeleted,
      sort: tableState.sorting.length > 0 ? tableState.sorting.map(({ id }) => id as UsersControllerGetUsersSortItem) : ['createdAt'],
      direction: tableState.sorting.length > 0 ? tableState.sorting.map(({ desc }) => desc ? 'desc' : 'asc') : ['desc'],
    };
  }, [table]);

  const { data } = useUsersControllerGetUsers(queryParams);
  const { data: overview } = useUsersControllerGetUserOverview();

  const users = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const includeDeleted = table.getState().columnFilters.find((filter) => filter.id === 'includeDeleted')?.value === true;

  const adminCount = overview?.adminUsers ?? 0;
  const twoFactorCount = overview?.twoFactorEnabledUsers ?? 0;

  table.setOptions((options) => ({
    ...options,
    data: users,
    pageCount: totalPages,
    rowCount: totalCount,
  }));

  return (
    <PageSection
      icon="users"
      title={t('users.title')}
      description={t('users.description')}
    >
      <PageSection.Actions>
        <div className="flex items-center justify-end">
          <Button
            variant={includeDeleted ? 'secondary' : 'outline'}
            onClick={() => {
              table.setPageIndex(0);
              table.setColumnFilters([{ id: 'includeDeleted', value: !includeDeleted }]);
            }}
            className="gap-2"
          >
            <UserX className="size-4 text-muted-foreground" />
            <span>{includeDeleted ? t('users.hideDeleted') : t('users.includeDeleted')}</span>
          </Button>
        </div>
      </PageSection.Actions>

      <PageSection.Content className="grid grid-rows-[auto_1fr] gap-6 p-2">
        <UserStatsCards
          total={t('users.count', { count: totalCount })}
          admins={t('users.count', { count: adminCount })}
          twoFactor={t('users.count', { count: twoFactorCount })}
        />
        <SectionCard textSize="sm">
          <SectionCard.Content className="grid h-full grid-rows-[auto_1fr_auto]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('users.searchPlaceholder')}
              onReset={() => {
                table.setPageIndex(0);
                table.resetColumnFilters();
              }}
            />
            <div className="flex-1">
              <DataGrid table={table} onRowClick={(row) => setSelectedUserId(row.original.id)} />
            </div>
            <DataTablePagination table={table} rowCount={totalCount} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>

      <PageSection.Dialogs>
        {selectedUserId && (
          <UserManagementDialog
            key={selectedUserId}
            userId={selectedUserId}
          />
        )}
      </PageSection.Dialogs>
    </PageSection>
  );
}
