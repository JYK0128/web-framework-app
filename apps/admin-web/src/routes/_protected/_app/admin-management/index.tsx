import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getUsersControllerGetUserOverviewV1QueryKey, getUsersControllerGetUsersV1QueryKey, useUsersControllerGetUserOverviewV1, useUsersControllerGetUsersV1 } from '#/.generated/api/endpoints/users/users';
import { type UserItemDto, UserStatus } from '#/.generated/api/model';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { alert } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { StatsCard } from '#/components/layout/stats-card';
import { openModal } from '#/components/modal';
import { authUserAtom } from '#/store/auth';

import { AdminDetailModal } from './-components/admin-detail-modal';
import { AdminRowActions } from './-components/admin-row-actions';
import { ChangeUserRoleModal } from './-components/change-user-role-modal';
import { CreateAdminModal } from './-components/create-admin-modal';

export const Route = createFileRoute('/_protected/_app/admin-management/')({
  component: AdminManagementPage,
});

function getUserStatus(user: UserItemDto): UserStatus {
  if (user.deleted) return UserStatus.deleted;
  if (user.banned) return UserStatus.banned;
  return UserStatus.active;
}

function AdminManagementPage() {
  const user = useAtomValue(authUserAtom);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);

  const canCreateUsers = user?.roleCode === 'super_admin';

  const usersQuery = useUsersControllerGetUsersV1({
    page,
    limit: 20,
    search: search.trim() || undefined,
    status,
    includeDeleted,
  });
  const overviewQuery = useUsersControllerGetUserOverviewV1();

  useEffect(() => {
    if (!usersQuery.isError) return;
    void alert({
      title: '관리자 목록 조회 실패',
      description: '관리자 목록을 불러오지 못했습니다.',
      tone: 'danger',
    });
  }, [usersQuery.error, usersQuery.isError]);

  const response = usersQuery.data?.data;
  const users = response?.items ?? [];
  const overview = overviewQuery.data?.data;
  const handleOpenDetail = useCallback((admin: UserItemDto) => {
    void openModal(AdminDetailModal, { userId: admin.id });
  }, []);
  const handleChangeRole = useCallback((admin: UserItemDto) => {
    void openModal(ChangeUserRoleModal, { user: admin });
  }, []);
  const columns: ColumnDef<UserItemDto>[] = useMemo(() => [
    {
      id: 'admin',
      header: '관리자',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      id: 'role',
      header: '역할',
      cell: ({ row }) => <StatusText>{row.original.roleLabel}</StatusText>,
    },
    {
      id: 'status',
      header: '상태',
      accessorFn: getUserStatus,
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterMultiple: false,
        filterOptions: [
          { label: '활성', value: UserStatus.active },
          { label: '정지', value: UserStatus.banned },
          { label: '삭제', value: UserStatus.deleted },
        ],
      },
      cell: ({ row }) => <StatusText tone={getStatusTone(row.original.deleted, row.original.banned)}>{getStatusLabel(row.original.deleted, row.original.banned)}</StatusText>,
    },
    {
      id: 'two-factor',
      header: '2FA',
      cell: ({ row }) => row.original.twoFactorEnabled ? '사용 중' : '미사용',
    },
    {
      id: 'created-at',
      header: '가입일',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('ko-KR'),
      cellClassName: 'whitespace-nowrap text-xs text-muted-foreground',
    },
    {
      id: 'tools',
      header: '관리',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <AdminRowActions
          user={row.original}
          canManage={user?.roleCode === 'super_admin'}
          currentUserId={user?.id}
          onOpenDetail={() => handleOpenDetail(row.original)}
          onChangeRole={() => handleChangeRole(row.original)}
        />
      ),
    },
  ], [handleChangeRole, handleOpenDetail, user?.id, user?.roleCode]);

  const table = useDataGrid({
    data: users,
    columns,
    pageCount: response?.totalPages ?? 1,
    initialState: { pagination: { pageIndex: page - 1, pageSize: 20 }, globalFilter: search },
    onPaginationChange: ({ pageIndex }) => setPage(pageIndex + 1),
    onGlobalFilterChange: (value) => {
      setPage(1);
      setSearch(typeof value === 'string' ? value : '');
    },
    onColumnFiltersChange: (filters: ColumnFiltersState) => {
      const statusValue = filters.find((filter) => filter.id === 'status')?.value;
      const nextStatus = Array.isArray(statusValue) ? statusValue[0] as UserStatus | undefined : undefined;
      setPage(1);
      setStatus(nextStatus);
    },
  });

  const handleCreateAdmin = async () => {
    const created = await openModal(CreateAdminModal);
    if (!created) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getUsersControllerGetUsersV1QueryKey() }),
      queryClient.invalidateQueries({ queryKey: getUsersControllerGetUserOverviewV1QueryKey() }),
    ]);
  };

  return (
    <PageSection icon="users" title="운영자 관리" description="운영자 계정을 조회하고 상태와 보안 정보를 확인합니다.">
      <PageSection.Actions>
        {canCreateUsers && (
          <Button type="button" onClick={() => void handleCreateAdmin()}>관리자 추가</Button>
        )}
      </PageSection.Actions>
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-6 p-2
      "
      >
        <div className="
          grid grid-cols-1 gap-3
          md:grid-cols-3
          lg:grid-cols-5
        "
        >
          {overviewQuery.isError
            ? (
              <Card className="
                md:col-span-3
                lg:col-span-5
              "
              >
                <CardContent className="p-4 text-sm text-destructive">
                  요약 정보를 불러오지 못했습니다.
                </CardContent>
              </Card>
            )
            : (
              <>
                <StatsCard label="전체 관리자" value={overview?.totalUsers ?? 0} icon="users" iconColor="text-blue-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="활성 관리자" value={overview?.activeUsers ?? 0} icon="user-check" iconColor="text-emerald-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="정지 관리자" value={overview?.bannedUsers ?? 0} icon="circle-alert" iconColor="text-amber-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="삭제 관리자" value={overview?.deletedUsers ?? 0} icon="trash-2" iconColor="text-red-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="2FA 사용 관리자" value={overview?.twoFactorEnabledUsers ?? 0} icon="shield-check" iconColor="text-violet-600" isLoading={overviewQuery.isLoading} />
              </>
            )}
        </div>

        <SectionCard textSize="sm" title="관리자 목록" description="관리자 이름 또는 이메일로 검색할 수 있습니다.">
          <SectionCard.Actions>
            <Button
              type="button"
              variant={includeDeleted ? 'secondary' : 'outline'}
              onClick={() => {
                setPage(1);
                setIncludeDeleted((current) => !current);
              }}
            >
              {includeDeleted ? '삭제 계정 숨기기' : '삭제 계정 포함'}
            </Button>
          </SectionCard.Actions>
          <SectionCard.Content className="
            grid h-full grid-rows-[auto_minmax(0,1fr)_auto]
          "
          >
            <DataGridToolbar table={table} searchPlaceholder="이름 또는 이메일 검색..." />
            <DataGrid table={table} onRowClick={(row) => handleOpenDetail(row.original)} />
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}

function StatusText({ children, tone = 'neutral' }: { children: string, tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const colors = {
    neutral: 'text-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-destructive',
  };
  return (
    <span className={`
      font-semibold
      ${colors[tone]}
    `}
    >
      {children}
    </span>
  );
}

function getStatusLabel(deleted: boolean, banned: boolean): string {
  if (deleted) return '삭제됨';
  if (banned) return '정지됨';
  return '활성';
}

function getStatusTone(deleted: boolean, banned: boolean): 'success' | 'warning' | 'danger' {
  if (deleted) return 'danger';
  if (banned) return 'warning';
  return 'success';
}
