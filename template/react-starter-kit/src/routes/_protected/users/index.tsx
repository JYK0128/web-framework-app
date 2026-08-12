import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type Updater } from '@tanstack/react-table';
import { Eye, RefreshCw, Search, ShieldAlert, ShieldCheck, User as UserIcon, UserCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useUsersControllerGetUsers } from '#/.generated/api/endpoints/users/users';
import type { UserItemDto } from '#/.generated/api/model';
import { Avatar, AvatarFallback, Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { useAppForm } from '#/components/form';

export const Route = createFileRoute('/_protected/users/')({
  component: UsersPageComponent,
});

type FilterFormValues = {
  search: string
  role: string
  limit: string
};

const columnHelper = createColumnHelper<UserItemDto>();

function UsersPageComponent() {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserItemDto | null>(null);

  const [activeFilters, setActiveFilters] = useState<{
    limit: number
    search?: string
    role?: string
  }>({
    limit: 10,
    search: undefined,
    role: undefined,
  });

  const filterForm = useAppForm<FilterFormValues>({
    defaultValues: {
      search: '',
      role: 'all',
      limit: '10',
    },
    onSubmit: ({ value }) => {
      setPage(1);
      setActiveFilters({
        limit: Number(value.limit),
        search: value.search.trim() || undefined,
        role: value.role !== 'all' ? value.role : undefined,
      });
    },
  });

  const queryParams = useMemo(() => ({
    page,
    limit: activeFilters.limit,
    search: activeFilters.search,
    role: activeFilters.role,
  }), [page, activeFilters]);

  const { data, isFetching, refetch } = useUsersControllerGetUsers(queryParams);

  const users = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin' || u.role === 'super-admin').length, [users]);
  const twoFactorCount = useMemo(() => users.filter((u) => u.twoFactorEnabled).length, [users]);

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      id: 'name',
      header: '사용자',
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
          <span className="font-semibold text-foreground">{row.original.name || '이름 없음'}</span>
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      id: 'email',
      header: '이메일',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground font-mono text-xs">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('role', {
      id: 'role',
      header: '역할',
      cell: ({ getValue }) => {
        const role = getValue();
        return (
          <Badge
            variant={role === 'admin' || role === 'super-admin' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {role}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('twoFactorEnabled', {
      id: 'twoFactorEnabled',
      header: '2FA 보안',
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
              <span>2FA 사용</span>
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
              <span>미사용</span>
            </Badge>
          );
      },
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: '가입일',
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">상세보기</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(row.original)}>
            <Eye className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
        </div>
      ),
    }),
  ], []);

  const table = useDataGrid({
    client: false,
    data: users,
    columns,
    pageCount: totalPages,
    rowCount: totalCount,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: activeFilters.limit,
      },
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const nextState = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: activeFilters.limit }) : updater;
      setPage(nextState.pageIndex + 1);
      if (nextState.pageSize !== activeFilters.limit) {
        setActiveFilters((prev) => ({ ...prev, limit: nextState.pageSize }));
      }
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header & Title */}
      <div className="
        flex flex-col gap-1
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div>
          <h1 className="
            text-2xl font-bold tracking-tight text-foreground flex items-center
            gap-2
          "
          >
            <Users className="size-6 text-primary" />
            <span>회원 목록 관리</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            DataGrid 및 Form 기반으로 등록된 회원 목록 조회가 가능합니다.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="
            self-start
            sm:self-auto
            gap-2
          "
        >
          <RefreshCw className={`
            size-4
            ${isFetching ? 'animate-spin' : ''}
          `}
          />
          <span>새로고침</span>
        </Button>
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
              전체 회원
            </span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold">
            {totalCount}
            명
          </div>
        </Card>
        <Card className="p-4 shadow-sm border bg-card">
          <div className="flex items-center justify-between">
            <span className="
              text-xs font-semibold text-muted-foreground uppercase
              tracking-wider
            "
            >
              관리자 계정
            </span>
            <UserCheck className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {adminCount}
            명
          </div>
        </Card>
        <Card className="p-4 shadow-sm border bg-card">
          <div className="flex items-center justify-between">
            <span className="
              text-xs font-semibold text-muted-foreground uppercase
              tracking-wider
            "
            >
              2차 인증(2FA) 활성
            </span>
            <ShieldCheck className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {twoFactorCount}
            명
          </div>
        </Card>
      </div>

      {/* Filter & Search Form */}
      <filterForm.AppForm>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void filterForm.handleSubmit();
          }}
        >
          <Card className="p-4 shadow-sm">
            <div className="
              flex flex-col gap-4
              sm:flex-row sm:items-center sm:justify-between
            "
            >
              <div className="flex-1">
                <filterForm.AppField name="search">
                  {(field) => (
                    <field.Input
                      placeholder="이름 또는 이메일 검색..."
                      leftSide={(
                        <Search className="
                          size-4 text-muted-foreground shrink-0
                        "
                        />
                      )}
                    />
                  )}
                </filterForm.AppField>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-[150px]">
                  <filterForm.AppField name="role">
                    {(field) => (
                      <field.Select
                        items={[
                          { value: 'all', label: '모든 역할' },
                          { value: 'admin', label: '관리자 (admin)' },
                          { value: 'user', label: '일반 회원 (user)' },
                        ]}
                      />
                    )}
                  </filterForm.AppField>
                </div>

                <div className="w-[110px]">
                  <filterForm.AppField name="limit">
                    {(field) => (
                      <field.Select
                        items={[
                          { value: '10', label: '10개씩' },
                          { value: '20', label: '20개씩' },
                          { value: '50', label: '50개씩' },
                        ]}
                      />
                    )}
                  </filterForm.AppField>
                </div>

                <Button type="submit" className="gap-2">
                  <Search className="size-4" />
                  <span>조회</span>
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </filterForm.AppForm>

      {/* User Data Grid */}
      <Card className="shadow-sm overflow-hidden flex flex-col">
        <DataGrid table={table} />
        <DataTablePagination table={table} rowCount={totalCount} />
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="size-5 text-primary" />
              <span>회원 상세 정보</span>
            </DialogTitle>
            <DialogDescription>선택한 사용자의 계정 세부 사항을 확인합니다.</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="grid gap-4 py-2">
              <div className="
                flex items-center gap-4 p-3 rounded-lg bg-muted/40 border
              "
              >
                <Avatar className="size-12">
                  <AvatarFallback className="
                    bg-primary/20 text-primary font-bold text-base
                  "
                  >
                    {selectedUser.name ? selectedUser.name.slice(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-base text-foreground">{selectedUser.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid gap-3 text-xs">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground font-medium">사용자 ID</span>
                  <span className="font-mono text-foreground">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground font-medium">권한 역할</span>
                  <Badge variant="outline">{selectedUser.role}</Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground font-medium">2단계 인증(2FA)</span>
                  <span>{selectedUser.twoFactorEnabled ? '활성화됨' : '미활성'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground font-medium">가입일시</span>
                  <span>{new Date(selectedUser.createdAt).toLocaleString('ko-KR')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground font-medium">최종 변경일시</span>
                  <span>{new Date(selectedUser.updatedAt).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
