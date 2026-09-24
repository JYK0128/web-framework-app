import { Permission } from '@pkg/shared';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCustomersControllerListCustomersV1QueryKey, useCustomersControllerListCustomersV1 } from '#/.generated/api/endpoints/customers/customers';
import type { AdminCustomerItem } from '#/.generated/api/model';
import { alert } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { authUserAtom } from '#/store/auth';

import { CustomerDetailModal } from './-components/customer-detail-modal';

export const Route = createFileRoute('/_protected/_app/customers/')({
  component: CustomerManagementPage,
});

const columnHelper = createColumnHelper<AdminCustomerItem>();

function CustomerManagementPage() {
  const user = useAtomValue(authUserAtom);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const canUpdate = user?.permissions.includes(Permission.customer.update.code) ?? false;
  const canDelete = user?.permissions.includes(Permission.customer.delete.code) ?? false;
  const customersQuery = useCustomersControllerListCustomersV1({
    page,
    limit: 20,
    search: search.trim() || undefined,
  });

  useEffect(() => {
    if (!customersQuery.isError) return;
    void alert({
      title: '고객 목록 조회 실패',
      description: '고객 목록을 불러오지 못했습니다.',
      tone: 'danger',
    });
  }, [customersQuery.error, customersQuery.isError]);

  const response = customersQuery.data?.data;
  const customers = response?.items ?? [];
  const handleOpenDetail = useCallback((customer: AdminCustomerItem) => {
    void openModal(CustomerDetailModal, {
      customerId: customer.id,
      canUpdate,
      canDelete,
      onChanged: () => void queryClient.invalidateQueries({ queryKey: getCustomersControllerListCustomersV1QueryKey() }),
    });
  }, [canDelete, canUpdate, queryClient]);
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: '고객',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    }),
    columnHelper.accessor('roleLabel', {
      id: 'membership',
      header: '멤버십',
      cell: ({ row }) => <span>{row.original.roleLabel ?? '미지정'}</span>,
    }),
    columnHelper.accessor('emailVerified', {
      id: 'email-verified',
      header: '이메일 인증',
      cell: ({ row }) => <StatusText tone={row.original.emailVerified ? 'success' : 'warning'}>{row.original.emailVerified ? '인증됨' : '미인증'}</StatusText>,
    }),
    columnHelper.accessor('banned', {
      id: 'status',
      header: '상태',
      cell: ({ row }) => <StatusText tone={row.original.banned ? 'danger' : 'success'}>{row.original.banned ? '정지됨' : '정상'}</StatusText>,
    }),
    columnHelper.accessor('createdAt', {
      id: 'created-at',
      header: '가입일',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('ko-KR'),
    }),
  ], []);

  const table = useDataGrid({
    data: customers,
    columns,
    pageCount: response?.totalPages ?? 1,
    initialState: { pagination: { pageIndex: page - 1, pageSize: 20 }, globalFilter: search },
    onPaginationChange: ({ pageIndex }) => setPage(pageIndex + 1),
    onGlobalFilterChange: (value) => {
      setPage(1);
      setSearch(typeof value === 'string' ? value : '');
    },
  });

  return (
    <PageSection icon="user-check" title="고객 관리" description="서비스 고객의 계정과 멤버십 정보를 조회합니다.">
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <SectionCard textSize="sm" title="고객 목록" description="이름 또는 이메일로 검색하고 행을 선택해 상세 정보를 확인할 수 있습니다.">
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

function StatusText({ children, tone }: { children: string, tone: 'success' | 'warning' | 'danger' }) {
  const colors = {
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
