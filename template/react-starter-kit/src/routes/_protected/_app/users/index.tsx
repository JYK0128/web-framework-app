import { useI18n } from '@pkg/shared/web';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type SortingState, type Updater } from '@tanstack/react-table';
import { Eye, ShieldAlert, ShieldCheck, UserCheck, Users, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useUsersControllerGetUserOverview, useUsersControllerGetUsers } from '#/.generated/api/endpoints/users/users';
import type { UserItemDto, UsersControllerGetUsersDirectionItem, UsersControllerGetUsersParams, UsersControllerGetUsersSortItem } from '#/.generated/api/model';
import { Avatar, AvatarFallback, Badge, Button, Card } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';

import { UserDetailDialog } from './-components/UserDetailDialog';

export const Route = createFileRoute('/_protected/_app/users/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'user:read')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: UsersPageComponent,
});

const columnHelper = createColumnHelper<UserItemDto>();

function UsersPageComponent() {
  const { language, t } = useI18n();
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [activeFilters, setActiveFilters] = useState<{
    limit: number
    search?: string
    includeDeleted: boolean
    filters?: UsersControllerGetUsersParams['filters']
    sort: UsersControllerGetUsersSortItem[]
    direction: UsersControllerGetUsersDirectionItem[]
  }>({
    limit: 10,
    search: undefined,
    includeDeleted: false,
    filters: undefined,
    sort: ['createdAt'],
    direction: ['desc'],
  });

  const queryParams = useMemo<UsersControllerGetUsersParams>(() => ({
    page,
    limit: activeFilters.limit,
    search: activeFilters.search,
    includeDeleted: activeFilters.includeDeleted,
    filters: activeFilters.filters,
    sort: activeFilters.sort,
    direction: activeFilters.direction,
  }), [page, activeFilters]);

  const { data } = useUsersControllerGetUsers(queryParams);
  const { data: overview } = useUsersControllerGetUserOverview();

  const handleGlobalFilterChange = (value: string) => {
    setPage(1);
    setActiveFilters((prev) => ({
      ...prev,
      search: value.trim() || undefined,
    }));
  };

  const handleSortingChange = (sorting: SortingState) => {
    const nextSorting = sorting.filter(({ id }) => id !== 'actions');
    setPage(1);
    setActiveFilters((prev) => ({
      ...prev,
      sort: nextSorting.length > 0
        ? nextSorting.map(({ id }) => id as UsersControllerGetUsersSortItem)
        : ['createdAt'],
      direction: nextSorting.length > 0
        ? nextSorting.map(({ desc }) => desc ? 'desc' : 'asc')
        : ['desc'],
    }));
  };

  const users = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const includeDeleted = activeFilters.includeDeleted;

  const adminCount = overview?.adminUsers ?? 0;
  const twoFactorCount = overview?.twoFactorEnabledUsers ?? 0;

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      id: 'name',
      header: t('users.user'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="
              bg-primary/10 text-primary text-xs font-bold
            "
            >
              {row.original.name ? row.original.name.slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground">{row.original.name || t('users.noName')}</span>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      id: 'email',
      header: t('users.email'),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground font-mono text-xs">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('role', {
      id: 'role',
      header: t('users.role'),
      cell: ({ getValue }) => {
        const role = getValue();
        let roleLabel = role;
        if (role === 'super-admin') roleLabel = t('users.superAdminRole');
        else if (role === 'admin') roleLabel = t('users.adminRole');
        else if (role === 'user') roleLabel = t('users.userRole');

        return (
          <Badge
            variant={role === 'admin' || role === 'super-admin' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {roleLabel}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('deleted', {
      id: 'status',
      header: t('users.status'),
      cell: ({ row }) => (
        <ListStatusBadge
          user={row.original}
          deletedLabel={t('users.deleted')}
          bannedLabel={t('users.banned')}
          activeLabel={t('users.active')}
        />
      ),
    }),
    columnHelper.accessor('twoFactorEnabled', {
      id: 'twoFactorEnabled',
      header: t('users.twoFactorSecurity'),
      cell: ({ getValue }) => {
        const enabled = getValue();
        return enabled
          ? (
            <Badge
              variant="outline"
              className="
                text-emerald-600 border-emerald-300 bg-emerald-50
                dark:bg-emerald-950/30
                flex items-center gap-1 w-fit text-2xs
              "
            >
              <ShieldCheck className="size-3 text-emerald-500" />
              <span>{t('users.twoFactorOn')}</span>
            </Badge>
          )
          : (
            <Badge
              variant="outline"
              className="
                text-muted-foreground flex items-center gap-1 w-fit text-2xs
              "
            >
              <ShieldAlert className="size-3 text-amber-500" />
              <span>{t('users.twoFactorOff')}</span>
            </Badge>
          );
      },
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: t('users.joinedAt'),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString(language.startsWith('ko') ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: t('common.manage'),
      enableSorting: false,
      size: 80,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUserId(row.original.id)} title={t('users.details')} aria-label={t('users.details')}>
            <Eye className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
        </div>
      ),
    }),
  ], [language, t]);

  const table = useDataGrid({
    client: false,
    data: users,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
    },
    pageCount: totalPages,
    rowCount: totalCount,
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const nextState = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: activeFilters.limit }) : updater;
      setPage(nextState.pageIndex + 1);
      if (nextState.pageSize !== activeFilters.limit) {
        setActiveFilters((prev) => ({ ...prev, limit: nextState.pageSize }));
      }
    },
    onGlobalFilterChange: handleGlobalFilterChange,
    onSortingChange: handleSortingChange,
  });

  useEffect(() => {
    table.setPageIndex(page - 1);
    table.setPageSize(activeFilters.limit);
  }, [activeFilters.limit, page, table]);

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      {/* Header & Title */}
      <div className="
        grid gap-4
        sm:flex sm:items-center sm:justify-between
      "
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="
              flex size-9 items-center justify-center rounded-lg bg-primary/10
              text-primary shadow-xs
            "
            >
              <Users className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('users.title')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('users.description')}
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Button
            variant={includeDeleted ? 'secondary' : 'outline'}
            onClick={() => {
              setPage(1);
              setActiveFilters((prev) => ({ ...prev, includeDeleted: !prev.includeDeleted }));
            }}
            className="gap-2"
          >
            <UserX className="size-4 text-muted-foreground" />
            <span>{includeDeleted ? t('users.hideDeleted') : t('users.includeDeleted')}</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="
        grid gap-4
        sm:grid-cols-3
      "
      >
        <Card className="p-4 shadow-sm border bg-card">
          <div className="flex items-center justify-between">
            <span className="
              text-xs font-semibold text-muted-foreground uppercase
              tracking-wider
            "
            >
              {t('users.totalUsers')}
            </span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold">
            {t('users.count', { count: totalCount })}
          </div>
        </Card>
        <Card className="p-4 shadow-sm border bg-card">
          <div className="flex items-center justify-between">
            <span className="
              text-xs font-semibold text-muted-foreground uppercase
              tracking-wider
            "
            >
              {t('users.adminAccounts')}
            </span>
            <UserCheck className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {t('users.count', { count: adminCount })}
          </div>
        </Card>
        <Card className="p-4 shadow-sm border bg-card">
          <div className="flex items-center justify-between">
            <span className="
              text-xs font-semibold text-muted-foreground uppercase
              tracking-wider
            "
            >
              {t('users.twoFactorActive')}
            </span>
            <ShieldCheck className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {t('users.count', { count: twoFactorCount })}
          </div>
        </Card>
      </div>

      {/* User Data Grid */}
      <Card className="grid grid-rows-[auto_1fr_auto] overflow-hidden shadow-sm">
        <DataGridToolbar
          table={table}
          searchPlaceholder={t('users.searchPlaceholder')}
          onReset={() => {
            setPage(1);
            setActiveFilters({
              limit: 10,
              search: undefined,
              includeDeleted: false,
              filters: undefined,
              sort: ['createdAt'],
              direction: ['desc'],
            });
          }}
        />
        <div className="flex-1">
          <DataGrid table={table} onRowClick={(row) => setSelectedUserId(row.original.id)} />
        </div>
        <DataTablePagination table={table} rowCount={totalCount} />
      </Card>

      <UserDetailDialog
        key={selectedUserId ?? 'none'}
        userId={selectedUserId}
        open={Boolean(selectedUserId)}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      />
    </div>
  );
}

function ListStatusBadge({ user, deletedLabel, bannedLabel, activeLabel }: {
  user: UserItemDto
  deletedLabel: string
  bannedLabel: string
  activeLabel: string
}) {
  if (user.deleted) return <Badge variant="destructive" className="text-xs">{deletedLabel}</Badge>;
  if (user.banned) return <Badge variant="destructive" className="text-xs">{bannedLabel}</Badge>;

  return <Badge variant="outline" className="text-xs text-emerald-600">{activeLabel}</Badge>;
}
