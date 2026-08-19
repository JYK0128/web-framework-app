import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type SortingState } from '@tanstack/react-table';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getNoticesControllerGetAdminNoticesQueryKey, useNoticesControllerCreateNotice, useNoticesControllerDeleteNotice, useNoticesControllerGetAdminNotices, useNoticesControllerUpdateNotice } from '#/.generated/api/endpoints/notices/notices';
import type { CreateNoticeRequestDto, NoticeItemDto, NoticesControllerGetAdminNoticesDirectionItem, NoticesControllerGetAdminNoticesParams, NoticesControllerGetAdminNoticesSortItem, UpdateNoticeRequestDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';

import { NoticeEditorDialog } from './-components/NoticeEditorDialog';

type NoticeStatus = 'draft' | 'scheduled' | 'published' | 'expired';

const columnHelper = createColumnHelper<NoticeItemDto>();

function getNoticeStatus(notice: NoticeItemDto, now: Date): NoticeStatus {
  if (!notice.publishedAt) return 'draft';
  if (new Date(notice.publishedAt) > now) return 'scheduled';
  if (notice.expiresAt && new Date(notice.expiresAt) <= now) return 'expired';
  return 'published';
}

export const Route = createFileRoute('/_protected/_app/notice-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'notice:manage')) throw notFound({ routeId: Route.id });
  },
  component: NoticesPageComponent,
});

function NoticesPageComponent() {
  const { language, t } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItemDto | null>(null);
  const [activeFilters, setActiveFilters] = useState<{
    limit: number
    search?: string
    sort: NoticesControllerGetAdminNoticesSortItem[]
    direction: NoticesControllerGetAdminNoticesDirectionItem[]
  }>({
    limit: 10,
    search: undefined,
    sort: ['createdAt'],
    direction: ['desc'],
  });

  const queryParams = useMemo<NoticesControllerGetAdminNoticesParams>(() => ({
    page,
    limit: activeFilters.limit,
    search: activeFilters.search,
    sort: activeFilters.sort,
    direction: activeFilters.direction,
  }), [activeFilters, page]);

  const { data } = useNoticesControllerGetAdminNotices(queryParams);
  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: getNoticesControllerGetAdminNoticesQueryKey() }), [queryClient]);
  const createMutation = useNoticesControllerCreateNotice();
  const updateMutation = useNoticesControllerUpdateNotice();
  const deleteMutation = useNoticesControllerDeleteNotice();
  const notices = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canCreate = hasPermission(user.permissions, 'notice:create');
  const canUpdate = hasPermission(user.permissions, 'notice:update');
  const canDelete = hasPermission(user.permissions, 'notice:delete');

  const handleGlobalFilterChange = (value: string) => {
    setPage(1);
    setActiveFilters((prev) => ({
      ...prev,
      search: value.trim() || undefined,
    }));
  };

  const handleSortingChange = (sorting: SortingState) => {
    const nextSorting = sorting.filter(({ id }) => id !== 'status' && id !== 'actions');
    setPage(1);
    setActiveFilters((prev) => ({
      ...prev,
      sort: nextSorting.length > 0
        ? nextSorting.map(({ id }) => id as NoticesControllerGetAdminNoticesSortItem)
        : ['createdAt'],
      direction: nextSorting.length > 0
        ? nextSorting.map(({ desc }) => desc ? 'desc' : 'asc')
        : ['desc'],
    }));
  };

  const handleSave = async (input: CreateNoticeRequestDto | UpdateNoticeRequestDto) => {
    try {
      if (editingNotice) await updateMutation.mutateAsync({ id: editingNotice.id, data: input });
      else await createMutation.mutateAsync({ data: input as CreateNoticeRequestDto });
      await invalidate();
      setEditorOpen(false);
      toast.success(t('notices.saveSuccess'));
    }
    catch {
      return;
    }
  };

  const handleDelete = useCallback(async (notice: NoticeItemDto) => {
    const isConfirmed = await confirm({
      description: t('notices.deleteConfirm'),
      tone: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync({ id: notice.id });
      await invalidate();
      toast.success(t('notices.deleteSuccess'));
    }
    catch {
      return;
    }
  }, [deleteMutation, invalidate, t]);

  const columns = useMemo(() => [
    columnHelper.accessor('title', {
      header: t('notices.titleField'),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.content}</div>
        </div>
      ),
      size: 320,
    }),
    columnHelper.display({
      id: 'status',
      header: t('notices.status'),
      enableSorting: false,
      cell: ({ row }) => (
        <NoticeStatusBadge
          status={getNoticeStatus(row.original, new Date())}
          labels={{
            draft: t('notices.draft'),
            scheduled: t('notices.scheduled'),
            published: t('notices.published'),
            expired: t('notices.expired'),
          }}
        />
      ),
      size: 110,
    }),
    columnHelper.accessor('priority', {
      header: t('notices.priorityField'),
      cell: ({ getValue }) => {
        const priority = getValue();
        if (priority === 2) return <Badge variant="destructive">{t('notices.urgent')}</Badge>;
        if (priority === 1) return <Badge variant="outline">{t('notices.important')}</Badge>;
        return t('notices.normal');
      },
      size: 100,
    }),
    columnHelper.accessor('publishedAt', {
      header: t('notices.publishedAt'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={dateLocale} />,
      size: 170,
    }),
    columnHelper.accessor('expiresAt', {
      header: t('notices.expiresAtField'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={dateLocale} />,
      size: 170,
    }),
    columnHelper.accessor('createdAt', {
      header: t('notices.createdAt'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={dateLocale} />,
      size: 170,
    }),
    columnHelper.display({
      id: 'actions',
      header: t('notices.actions'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingNotice(row.original);
                setEditorOpen(true);
              }}
            >
              <Pencil className="size-4" />
              <span className="sr-only">{t('notices.edit')}</span>
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" onClick={() => void handleDelete(row.original)}>
              <Trash2 className="size-4 text-destructive" />
              <span className="sr-only">{t('notices.delete')}</span>
            </Button>
          )}
        </div>
      ),
      size: 100,
    }),
  ], [canDelete, canUpdate, dateLocale, handleDelete, t]);

  const table = useDataGrid({
    client: false,
    data: notices,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    rowCount: totalCount,
    pageCount: totalPages,
    defaultColumn: { size: 140 },
    initialState: {
      pagination: { pageIndex: page - 1, pageSize: activeFilters.limit },
      sorting: [{ id: 'createdAt', desc: true }],
    },
    onPaginationChange: (nextPagination: PaginationState) => {
      setPage(nextPagination.pageIndex + 1);
      if (nextPagination.pageSize !== activeFilters.limit) {
        setPage(1);
        setActiveFilters((prev) => ({ ...prev, limit: nextPagination.pageSize }));
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
      mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      {/* Header Section */}
      <div className="
        flex flex-col gap-4
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="
              flex size-9 items-center justify-center rounded-lg bg-primary/10
              text-primary shadow-xs
            "
            >
              <Megaphone className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('notices.pageTitle')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('notices.description')}</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingNotice(null);
              setEditorOpen(true);
            }}
            className="
              gap-2 self-start shadow-xs
              sm:self-auto
            "
          >
            <Plus className="size-4" />
            {t('notices.create')}
          </Button>
        )}
      </div>
      <Card className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle className="text-base">{t('notices.listTitle')}</CardTitle>
          <CardDescription>{t('notices.listDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="
          grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden p-0
        "
        >
          <DataGridToolbar
            table={table}
            searchPlaceholder={t('notices.searchPlaceholder')}
            onReset={() => {
              setPage(1);
              setActiveFilters({
                limit: 10,
                search: undefined,
                sort: ['createdAt'],
                direction: ['desc'],
              });
            }}
          />
          <div className="min-h-0 flex-1">
            <DataGrid
              table={table}
              onRowClick={(row) => {
                setEditingNotice(row.original);
                setEditorOpen(true);
              }}
            />
          </div>
          <DataTablePagination table={table} rowCount={totalCount} />
        </CardContent>
      </Card>
      <NoticeEditorDialog key={`${editorOpen}-${editingNotice?.id ?? 'new'}`} open={editorOpen} notice={editingNotice} isSaving={isSaving} onOpenChange={setEditorOpen} onSave={handleSave} />
    </div>
  );
}

function NoticeStatusBadge({ status, labels }: { status: NoticeStatus, labels: Record<NoticeStatus, string> }) {
  let variant: 'default' | 'outline' | 'secondary' = 'secondary';
  if (status === 'published') variant = 'default';
  else if (status === 'scheduled') variant = 'outline';

  return <Badge variant={variant}>{labels[status]}</Badge>;
}

function DateCell({ value, locale }: { value: string | null, locale: string }) {
  return <span className="text-xs text-muted-foreground">{value ? new Date(value).toLocaleString(locale) : '-'}</span>;
}
