import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, CheckCircle2, LogOut, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getAuthControllerLogoutMutationOptions, getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { adminApi, type AdminUser, type AdminUserStatus } from '#/core/admin-api';
import { SessionActivityGuard } from '#/core/auth/session-activity-guard';

type AdminProfile = {
  name: string
  role?: 'admin' | 'super-admin'
};

type AuthProfileResponse = {
  data?: {
    user?: AdminProfile
    expiresAt?: string | null
  }
};

const statusLabels: Record<'all' | AdminUserStatus, string> = {
  all: '전체 상태',
  active: '활성',
  suspended: '정지',
};

export const Route = createFileRoute('/admin/')({
  beforeLoad: async ({ context }) => {
    const response = await context.queryClient
      .fetchQuery(getAuthControllerUserProfileQueryOptions())
      .catch(() => null) as AuthProfileResponse | null;
    const profile = response?.data?.user;
    if (!profile) throw redirect({ to: '/login' });
    if (profile.role !== 'admin' && profile.role !== 'super-admin') {
      throw redirect({ to: '/' });
    }
    return { profile, expiresAt: response?.data?.expiresAt ?? null };
  },
  component: AdminConsole,
});

function AdminConsole() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | AdminUserStatus>('all');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const { profile, expiresAt } = Route.useRouteContext();

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => adminApi.getOverview(),
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', submittedSearch, status],
    queryFn: () => adminApi.getUsers({
      search: submittedSearch || undefined,
      status,
      limit: 50,
    }),
  });
  const logoutMutation = useMutation(getAuthControllerLogoutMutationOptions());

  const overview = overviewQuery.data?.data;
  const users = usersQuery.data?.data.users ?? [];

  const toggleStatus = useCallback(async (user: AdminUser) => {
    const nextStatus: AdminUserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      ]);
      toast.success(nextStatus === 'active' ? '사용자를 활성화했습니다.' : '사용자를 정지했습니다.');
    }
    catch {
      toast.error('사용자 상태를 변경하지 못했습니다.');
    }
  }, [queryClient]);

  const columns = useMemo(() => createUserColumns(toggleStatus), [toggleStatus]);
  const table = useDataGrid({
    data: users,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  async function logout() {
    await logoutMutation.mutateAsync({});
    await navigate({ to: '/login', replace: true });
  }

  return (
    <SessionActivityGuard expiresAt={expiresAt}>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="
          sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm
          supports-[backdrop-filter]:bg-background/60
        "
        >
          <div className="
            container mx-auto flex h-16 max-w-7xl items-center justify-between
            px-4
            sm:px-6
          "
          >
            <div className="flex items-center gap-3">
              <div className="
                flex size-9 items-center justify-center rounded-lg bg-primary
                text-primary-foreground
              "
              >
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">GATEHOUSE</p>
                <h1 className="text-base font-semibold">관리자</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="
                  hidden
                  sm:inline-flex
                "
              >
                {profile.name}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                <LogOut className="size-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </header>

        <main className="
          container mx-auto grid w-full max-w-7xl flex-1
          grid-rows-[auto_auto_1fr] gap-6 px-4 py-8
          sm:px-6
        "
        >
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">사용자 관리</Badge>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">관리자 사용자</h2>
              <p className="mt-1 text-sm text-muted-foreground">관리자 계정과 접근 상태를 관리합니다.</p>
            </div>
          </div>

          <section className="
            grid gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
          >
            <MetricCard
              label="전체 사용자"
              value={overview?.totalUsers}
              icon={(
                <Users className="size-5" />
              )}
            />
            <MetricCard
              label="활성 사용자"
              value={overview?.activeUsers}
              icon={(
                <CheckCircle2 className="size-5" />
              )}
            />
            <MetricCard
              label="정지 사용자"
              value={overview?.suspendedUsers}
              icon={(
                <Ban className="size-5" />
              )}
            />
            <MetricCard
              label="오늘 가입"
              value={overview?.newUsersToday}
              icon={(
                <RefreshCw className="size-5" />
              )}
            />
          </section>

          <Card className="h-full">
            <CardHeader>
              <CardTitle>계정 목록</CardTitle>
              <CardDescription>
                총
                {usersQuery.data?.data.total ?? 0}
                명
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {usersQuery.isLoading
                ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )
                : (
                  <div className="
                    grid flex-1 grid-rows-[auto_1fr_auto] overflow-hidden
                    rounded-lg border
                  "
                  >
                    <div className="
                      flex flex-col gap-2 border-b p-4
                      sm:flex-row
                    "
                    >
                      <div className="
                        relative flex-1
                        sm:max-w-sm
                      "
                      >
                        <Search className="
                          pointer-events-none absolute left-3 top-1/2 size-4
                          -translate-y-1/2 text-muted-foreground
                        "
                        />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') setSubmittedSearch(search);
                          }}
                          placeholder="이름 또는 이메일 검색"
                          aria-label="이름 또는 이메일 검색"
                          className="pl-9"
                        />
                      </div>
                      <Select
                        value={status}
                        onValueChange={(value) => {
                          if (value === 'all' || value === 'active' || value === 'suspended') setStatus(value);
                        }}
                      >
                        <SelectTrigger
                          className="
                            w-full
                            sm:w-36
                          "
                          aria-label="사용자 상태 필터"
                        >
                          <SelectValue>{statusLabels[status]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체 상태</SelectItem>
                          <SelectItem value="active">활성</SelectItem>
                          <SelectItem value="suspended">정지</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={() => setSubmittedSearch(search)}>검색</Button>
                    </div>
                    <div>
                      <DataGrid table={table} />
                    </div>
                    <DataTablePagination table={table} rowCount={users.length} size={[10, 20, 50]} />
                  </div>
                )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SessionActivityGuard>
  );
}

function createUserColumns(onToggleStatus: (user: AdminUser) => Promise<void>): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: 'name',
      header: '사용자',
      size: 280,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.name}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: '권한',
      size: 110,
      cell: ({ row }) => (
        <Badge variant={row.original.role === 'admin' || row.original.role === 'super-admin' ? 'default' : 'outline'}>
          {getRoleLabel(row.original.role)}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: '상태',
      size: 100,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'lastLoginAt',
      header: '최근 로그인',
      size: 190,
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.lastLoginAt)}</span>,
    },
    {
      id: 'actions',
      header: '관리',
      size: 120,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      cell: ({ row }) => row.original.role === 'super-admin'
        ? <Badge variant="secondary">보호됨</Badge>
        : (
          <Button variant="outline" size="sm" onClick={() => void onToggleStatus(row.original)}>
            {row.original.status === 'active' ? '정지' : '활성화'}
          </Button>
        ),
    },
  ];
}

function getRoleLabel(role: AdminUser['role']): string {
  if (role === 'super-admin') return '최고 관리자';
  if (role === 'admin') return '관리자';
  return '-';
}

function MetricCard({ label, value, icon }: { label: string, value?: number, icon: ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-center justify-between text-2xl">
          {value ?? <Skeleton className="h-8 w-12" />}
          <span className="text-primary">{icon}</span>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function StatusBadge({ status }: { status: AdminUserStatus }) {
  return <Badge variant={status === 'active' ? 'default' : 'destructive'}>{status === 'active' ? '활성' : '정지'}</Badge>;
}

function formatDate(value: string | null): string {
  if (!value) return '없음';
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
