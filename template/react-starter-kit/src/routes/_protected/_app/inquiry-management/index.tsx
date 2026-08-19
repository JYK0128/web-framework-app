import { z } from '@pkg/shared/common';
import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type Row, type SortingState } from '@tanstack/react-table';
import { ClipboardList, MessageSquare, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getInquiriesControllerGetAdminInquiriesQueryKey, getInquiriesControllerGetAdminInquiryQueryKey, useInquiriesControllerDeleteAdminInquiry, useInquiriesControllerGetAdminInquiries, useInquiriesControllerGetAdminInquiry } from '#/.generated/api/endpoints/inquiries/inquiries';
import type { InquiriesControllerGetAdminInquiriesParams, InquiriesControllerGetAdminInquiriesSortItem, InquiryItemDto, InquiryStatus } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { InquiryChatDialog } from '#/routes/_protected/_app/inquiry/-components/InquiryChatDialog';
import { InquiryStatusBadge } from '#/routes/_protected/_app/inquiry/-components/InquiryStatusBadge';

export const Route = createFileRoute('/_protected/_app/inquiry-management/')({
  validateSearch: z.object({
    inquiryId: z.string().optional(),
  }),
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'inquiry:manage')) throw notFound({ routeId: Route.id });
  },
  component: InquiryManagementPageComponent,
});

const columnHelper = createColumnHelper<InquiryItemDto>();

function InquiryManagementPageComponent() {
  const { inquiryId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { language, t } = useI18n();
  const locale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | InquiryStatus>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItemDto | null>(null);

  const { data: routeInquiryData } = useInquiriesControllerGetAdminInquiry(inquiryId ?? '', {
    query: { enabled: Boolean(inquiryId) },
  });

  const activeInquiry = selectedInquiry ?? (inquiryId ? (routeInquiryData ?? null) : null);

  const deleteMutation = useInquiriesControllerDeleteAdminInquiry();

  const queryParams = useMemo<InquiriesControllerGetAdminInquiriesParams>(() => {
    const sort = (sorting[0]?.id ?? 'createdAt') as InquiriesControllerGetAdminInquiriesSortItem;
    const direction = (sorting[0]?.desc ? 'desc' : 'asc');

    return {
      page,
      limit: pageSize,
      search: search || undefined,
      status: statusTab === 'all' ? undefined : statusTab,
      sort: [sort],
      direction: [direction],
    };
  }, [page, pageSize, search, sorting, statusTab]);

  const { data, isLoading } = useInquiriesControllerGetAdminInquiries(queryParams);
  const inquiries = data?.items ?? [];

  const handleDelete = useCallback(async (inquiry: InquiryItemDto) => {
    const ok = await confirm({
      title: t('inquiries.deleteConfirmTitle'),
      description: t('inquiries.deleteConfirmDescription'),
      confirmText: t('inquiries.deleteInquiry'),
      cancelText: t('inquiries.cancel'),
      variant: 'destructive',
    });

    if (ok) {
      try {
        await deleteMutation.mutateAsync({ id: inquiry.id });
        await queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiriesQueryKey() });
      }
      catch {
        // Handled globally
      }
    }
  }, [deleteMutation, queryClient, t]);

  const columns = useMemo(() => [
    columnHelper.accessor('userName', {
      header: t('users.user'),
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      size: 130,
    }),
    columnHelper.accessor('category', {
      header: t('inquiries.category'),
      cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      size: 140,
    }),
    columnHelper.accessor('title', {
      header: t('inquiries.title'),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.content}</div>
        </div>
      ),
      size: 360,
    }),
    columnHelper.accessor('status', {
      header: t('inquiries.status'),
      cell: ({ getValue }) => <InquiryStatusBadge status={getValue()} />,
      size: 110,
    }),
    columnHelper.accessor('assigneeName', {
      header: t('inquiries.assignee'),
      cell: ({ getValue }) => {
        const val = getValue();
        return val
          ? (
            <span className="text-xs font-medium text-foreground">{val}</span>
          )
          : (
            <span className="text-xs text-muted-foreground">{t('inquiries.unassigned')}</span>
          );
      },
      size: 130,
    }),
    columnHelper.accessor('createdAt', {
      header: t('inquiries.createdAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString(locale)}</span>,
      size: 130,
    }),
    columnHelper.display({
      id: 'actions',
      header: t('common.manage'),
      enableSorting: false,
      size: 90,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title={t('inquiries.reply')}
            aria-label={t('inquiries.reply')}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedInquiry(row.original);
            }}
          >
            <MessageSquare className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title={t('inquiries.deleteInquiry')}
            aria-label={t('inquiries.deleteInquiry')}
            className="
              text-destructive
              hover:text-destructive
            "
            onClick={(event) => {
              event.stopPropagation();
              void handleDelete(row.original);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
      size: 80,
    }),
  ], [handleDelete, locale, t]);

  const table = useDataGrid({
    client: false,
    data: inquiries,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    rowCount: data?.totalCount ?? 0,
    pageCount: data?.totalPages ?? 1,
    initialState: { pagination: { pageIndex: page - 1, pageSize }, sorting },
    onPaginationChange: (next: PaginationState) => {
      setPage(next.pageIndex + 1);
      setPageSize(next.pageSize);
    },
    onSortingChange: (next: SortingState) => {
      setSorting(next);
      setPage(1);
    },
    onGlobalFilterChange: (value: string) => {
      setSearch(value.trim());
      setPage(1);
    },
    getRowId: (row) => row.id,
  });

  let tableContent = (
    <DataGrid
      table={table}
      onRowClick={(row: Row<InquiryItemDto>) => setSelectedInquiry(row.original)}
    />
  );
  if (isLoading) {
    tableContent = (
      <div className="flex justify-center p-12 text-sm text-muted-foreground">
        {t('inquiries.loading')}
      </div>
    );
  }
  else if (inquiries.length === 0) {
    tableContent = (
      <div className="flex justify-center p-12 text-sm text-muted-foreground">
        {search ? t('inquiries.noResults') : t('inquiries.noInquiries')}
      </div>
    );
  }

  const handleDialogStatusChange = useCallback((status: InquiryStatus) => {
    setSelectedInquiry((prev) => (prev ? { ...prev, status } : prev));
    void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiriesQueryKey() });
    if (inquiryId) {
      void queryClient.invalidateQueries({ queryKey: getInquiriesControllerGetAdminInquiryQueryKey(inquiryId) });
    }
  }, [inquiryId, queryClient]);

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="
            flex size-9 items-center justify-center rounded-lg bg-primary/10
            text-primary shadow-xs
          "
          >
            <ClipboardList className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('inquiries.managementTitle')}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('inquiries.managementDescription')}</p>
      </div>

      <Tabs
        value={statusTab}
        onValueChange={(val) => {
          setStatusTab(val as 'all' | InquiryStatus);
          setPage(1);
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">{t('inquiries.tabAll')}</TabsTrigger>
          <TabsTrigger value="pending">{t('inquiries.tabPending')}</TabsTrigger>
          <TabsTrigger value="answered">{t('inquiries.tabAnswered')}</TabsTrigger>
          <TabsTrigger value="closed">{t('inquiries.tabClosed')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden">
        <CardHeader className="shrink-0 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">{t('inquiries.managementListTitle')}</CardTitle>
              <CardDescription>{t('inquiries.totalCount', { count: data?.totalCount ?? 0 })}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="
          grid min-h-0 grid-rows-[auto_1fr] overflow-hidden p-0
        "
        >
          <DataGridToolbar
            table={table}
            searchPlaceholder={t('inquiries.searchPlaceholder')}
            onReset={() => {
              setPage(1);
              setSearch('');
              setStatusTab('all');
              setSorting([{ id: 'createdAt', desc: true }]);
            }}
          />
          <div className="min-h-0 flex-1">
            {tableContent}
          </div>
        </CardContent>
        <div className="border-t p-4"><DataTablePagination table={table} /></div>
      </Card>
      <InquiryChatDialog
        mode="admin"
        inquiry={activeInquiry}
        open={Boolean(activeInquiry)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedInquiry(null);
            void navigate({
              search: (prev) => {
                const next = { ...prev };
                delete next.inquiryId;
                return next;
              },
            });
          }
        }}
        onStatusChange={handleDialogStatusChange}
      />
    </div>
  );
}
