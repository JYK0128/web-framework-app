import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getOperatorsControllerGetOperatorOverviewV1QueryKey, getOperatorsControllerGetOperatorsV1QueryKey, useOperatorsControllerGetOperatorOverviewV1, useOperatorsControllerGetOperatorsV1 } from '#/.generated/api/endpoints/operators/operators';
import { type OperatorItem, OperatorStatus } from '#/.generated/api/model';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { alert } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { StatsCard } from '#/components/layout/stats-card';
import { openModal } from '#/components/modal';
import { authUserAtom } from '#/store/auth';

import { ChangeOperatorRoleModal } from './-components/change-operator-role-modal';
import { CreateOperatorModal } from './-components/create-operator-modal';
import { OperatorDetailModal } from './-components/operator-detail-modal';
import { OperatorRowActions } from './-components/operator-row-actions';

export const Route = createFileRoute('/_protected/_app/operator-management/')({
  component: OperatorManagementPage,
});

function getOperatorStatus(operator: OperatorItem): OperatorStatus {
  if (operator.deleted) return OperatorStatus.deleted;
  if (operator.banned) return OperatorStatus.banned;
  return OperatorStatus.active;
}

function OperatorManagementPage() {
  const operator = useAtomValue(authUserAtom);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OperatorStatus | undefined>();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);

  const canCreateOperators = operator?.roleCode === 'super_admin';

  const operatorsQuery = useOperatorsControllerGetOperatorsV1({
    page,
    limit: 20,
    search: search.trim() || undefined,
    status,
    includeDeleted,
  });
  const overviewQuery = useOperatorsControllerGetOperatorOverviewV1();

  useEffect(() => {
    if (!operatorsQuery.isError) return;
    void alert({
      title: '운영자 목록 조회 실패',
      description: '운영자 목록을 불러오지 못했습니다.',
      tone: 'danger',
    });
  }, [operatorsQuery.error, operatorsQuery.isError]);

  const response = operatorsQuery.data?.data;
  const operators = response?.items ?? [];
  const overview = overviewQuery.data?.data;
  const handleOpenDetail = useCallback((operator: OperatorItem) => {
    void openModal(OperatorDetailModal, { operatorId: operator.id });
  }, []);
  const handleChangeRole = useCallback((operator: OperatorItem) => {
    void openModal(ChangeOperatorRoleModal, { operator });
  }, []);
  const columns: ColumnDef<OperatorItem>[] = useMemo(() => [
    {
      id: 'operator',
      header: '운영자',
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
      accessorFn: getOperatorStatus,
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterMultiple: false,
        filterOptions: [
          { label: '활성', value: OperatorStatus.active },
          { label: '정지', value: OperatorStatus.banned },
          { label: '삭제', value: OperatorStatus.deleted },
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
      header: '도구',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <OperatorRowActions
          operator={row.original}
          canManage={operator?.roleCode === 'super_admin'}
          currentOperatorId={operator?.id}
          onOpenDetail={() => handleOpenDetail(row.original)}
          onChangeRole={() => handleChangeRole(row.original)}
        />
      ),
    },
  ], [handleChangeRole, handleOpenDetail, operator?.id, operator?.roleCode]);

  const table = useDataGrid({
    data: operators,
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
      const nextStatus = Array.isArray(statusValue) ? statusValue[0] as OperatorStatus | undefined : undefined;
      setPage(1);
      setStatus(nextStatus);
    },
  });

  const handleCreateOperator = async () => {
    const created = await openModal(CreateOperatorModal);
    if (!created) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getOperatorsControllerGetOperatorsV1QueryKey() }),
      queryClient.invalidateQueries({ queryKey: getOperatorsControllerGetOperatorOverviewV1QueryKey() }),
    ]);
  };

  return (
    <PageSection icon="users" title="운영자 관리" description="운영자 계정을 조회하고 상태와 보안 정보를 확인합니다.">
      <PageSection.Actions>
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
                <StatsCard label="전체 운영자" value={overview?.totalOperators ?? 0} icon="users" iconColor="text-blue-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="활성 운영자" value={overview?.activeOperators ?? 0} icon="user-check" iconColor="text-emerald-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="정지 운영자" value={overview?.bannedOperators ?? 0} icon="circle-alert" iconColor="text-amber-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="삭제 운영자" value={overview?.deletedOperators ?? 0} icon="trash-2" iconColor="text-red-600" isLoading={overviewQuery.isLoading} />
                <StatsCard label="2FA 사용 운영자" value={overview?.twoFactorEnabledOperators ?? 0} icon="shield-check" iconColor="text-violet-600" isLoading={overviewQuery.isLoading} />
              </>
            )}
        </div>

        <SectionCard textSize="sm" title="운영자 목록" description="운영자 이름 또는 이메일로 검색할 수 있습니다.">
          <SectionCard.Actions>
            {canCreateOperators && (
              <Button type="button" variant="outline" onClick={() => void handleCreateOperator()}>운영자 추가</Button>
            )}
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
