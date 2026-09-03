import { createFileRoute, notFound } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { useUsersControllerGetUserOverview, useUsersControllerGetUsers } from '#/.generated/api/endpoints/users/users';
import type { RoleName, UserFilterStatus, UsersControllerGetUsersParams, UsersControllerGetUsersSortItem } from '#/.generated/api/model';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { openDialog, PageSection, SectionCard } from '#/components/app';
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

  const handleShowUserDetails = (userId: string) => {
    void openDialog(UserManagementDialog, { userId });
  };

  const columns = useMemo(
    () => createUserColumns({ i18n, onShowDetails: handleShowUserDetails }),
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

    // role filter
    const roleFilterVal = tableState.columnFilters.find((filter) => filter.id === 'role')?.value;
    const role = Array.isArray(roleFilterVal)
      ? (roleFilterVal[0] as RoleName | undefined)
      : (roleFilterVal as RoleName | undefined);

    // twoFactorEnabled filter
    const twoFactorFilterVal = tableState.columnFilters.find((filter) => filter.id === 'twoFactorEnabled')?.value;
    const twoFactorRaw: unknown = Array.isArray(twoFactorFilterVal) ? twoFactorFilterVal[0] : twoFactorFilterVal;
    let twoFactorEnabled: boolean | undefined;
    if (twoFactorRaw === 'true' || twoFactorRaw === true) {
      twoFactorEnabled = true;
    }
    else if (twoFactorRaw === 'false' || twoFactorRaw === false) {
      twoFactorEnabled = false;
    }

    // status filter
    const statusFilterVal = tableState.columnFilters.find((filter) => filter.id === 'status')?.value;
    const status = Array.isArray(statusFilterVal)
      ? (statusFilterVal[0] as UserFilterStatus | undefined)
      : (statusFilterVal as UserFilterStatus | undefined);

    return {
      page: tableState.pagination.pageIndex + 1,
      limit: tableState.pagination.pageSize,
      search: when((value): value is string => typeof value === 'string', (search) => search || undefined)(tableState.globalFilter),
      includeDeleted,
      filters: {
        ...(role ? { role } : {}),
        ...(twoFactorEnabled !== undefined ? { twoFactorEnabled } : {}),
        ...(status ? { status } : {}),
      },
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

  const currentRoleFilter = (table.getState().columnFilters.find((filter) => filter.id === 'role')?.value as string) ?? 'ALL';
  const currentTwoFactorFilter = (() => {
    const val = table.getState().columnFilters.find((filter) => filter.id === 'twoFactorEnabled')?.value;
    if (val === 'true' || val === true) return 'true';
    if (val === 'false' || val === false) return 'false';
    return 'ALL';
  })();
  const currentStatusFilter = (table.getState().columnFilters.find((filter) => filter.id === 'status')?.value as string) ?? 'ALL';

  const adminCount = overview?.adminUsers ?? 0;
  const twoFactorCount = overview?.twoFactorEnabledUsers ?? 0;

  table.setOptions((options) => ({
    ...options,
    data: users,
    pageCount: totalPages,
    rowCount: totalCount,
  }));

  const handleRoleChange = (val: string | null) => {
    table.setPageIndex(0);
    table.getColumn('role')?.setFilterValue(val === 'ALL' || !val ? undefined : val);
  };

  const handleTwoFactorChange = (val: string | null) => {
    table.setPageIndex(0);
    table.getColumn('twoFactorEnabled')?.setFilterValue(val === 'ALL' || !val ? undefined : val);
  };

  const handleStatusChange = (val: string | null) => {
    table.setPageIndex(0);
    table.getColumn('status')?.setFilterValue(val === 'ALL' || !val ? undefined : val);
  };

  return (
    <PageSection
      icon="users"
      title={t('users.title')}
      description={t('users.description')}
      actions={[
        {
          label: includeDeleted ? t('users.hideDeleted') : t('users.includeDeleted'),
          icon: 'user-x',
          variant: includeDeleted ? 'secondary' : 'outline',
          onClick: () => {
            table.setPageIndex(0);
            table.setColumnFilters((prev) => [
              ...prev.filter((f) => f.id !== 'includeDeleted'),
              { id: 'includeDeleted', value: !includeDeleted },
            ]);
          },
        },
      ]}
    >
      <PageSection.Content className="grid grid-rows-[auto_auto_1fr] gap-6 p-2">
        <UserStatsCards
          total={t('users.count', { count: totalCount })}
          admins={t('users.count', { count: adminCount })}
          twoFactor={t('users.count', { count: twoFactorCount })}
        />

        {/* 세부 필터 바 */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 역할 필터 */}
          <Select
            items={[
              { label: t('users.allRoles'), value: 'ALL' },
              { label: t('users.adminRole'), value: 'admin' },
              { label: t('users.userRole'), value: 'user' },
            ]}
            value={currentRoleFilter}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('users.allRoles')}</SelectItem>
              <SelectItem value="admin">{t('users.adminRole')}</SelectItem>
              <SelectItem value="user">{t('users.userRole')}</SelectItem>
            </SelectContent>
          </Select>

          {/* 2FA 보안 필터 */}
          <Select
            items={[
              { label: t('users.allTwoFactor'), value: 'ALL' },
              { label: t('users.twoFactorOn'), value: 'true' },
              { label: t('users.twoFactorOff'), value: 'false' },
            ]}
            value={currentTwoFactorFilter}
            onValueChange={handleTwoFactorChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('users.allTwoFactor')}</SelectItem>
              <SelectItem value="true">{t('users.twoFactorOn')}</SelectItem>
              <SelectItem value="false">{t('users.twoFactorOff')}</SelectItem>
            </SelectContent>
          </Select>

          {/* 계정 상태 필터 */}
          <Select
            items={[
              { label: t('users.allStatus'), value: 'ALL' },
              { label: t('users.active'), value: 'active' },
              { label: t('users.banned'), value: 'banned' },
              { label: t('users.deleted'), value: 'deleted' },
            ]}
            value={currentStatusFilter}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('users.allStatus')}</SelectItem>
              <SelectItem value="active">{t('users.active')}</SelectItem>
              <SelectItem value="banned">{t('users.banned')}</SelectItem>
              <SelectItem value="deleted">{t('users.deleted')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            <div className="size-full">
              <DataGrid table={table} onRowClick={(row) => handleShowUserDetails(row.original.id)} />
            </div>
            <DataTablePagination table={table} rowCount={totalCount} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
import { when } from '@pkg/shared/common';
