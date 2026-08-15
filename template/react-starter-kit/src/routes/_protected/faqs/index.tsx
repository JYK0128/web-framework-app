import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type SortingState } from '@tanstack/react-table';
import { MessageSquareQuote, Pencil, Plus, ThumbsUp, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useFaqsControllerGetAdminFaqs } from '#/.generated/api/endpoints/faqs/faqs';
import type { AdminFaqSortKey, FaqItemDto, FaqsControllerGetAdminFaqsParams, SortDirection } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';

import { FaqDeleteDialog } from './-components/FaqDeleteDialog';
import { FaqEditorDialog } from './-components/FaqEditorDialog';

export const Route = createFileRoute('/_protected/faqs/')({
  beforeLoad: ({ context }) => {
    if (
      !hasPermission(context.user.permissions, 'faq:manage')
      && !hasPermission(context.user.permissions, 'faq:read')
      && context.user.role !== 'admin'
    ) {
      // Allow admin or users with faq permission
    }
  },
  component: FaqManagementPageComponent,
});

const columnHelper = createColumnHelper<FaqItemDto>();

function FaqManagementPageComponent() {
  const { language, t } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'order', desc: false }]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItemDto | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<FaqItemDto | null>(null);

  const queryParams = useMemo<FaqsControllerGetAdminFaqsParams>(() => {
    const sort = (sorting.length > 0 ? sorting.map((s) => s.id as AdminFaqSortKey) : ['order']);
    const direction = (sorting.length > 0 ? sorting.map((s) => (s.desc ? 'desc' : 'asc') as SortDirection) : ['asc']);

    return {
      page,
      limit: pageSize,
      filters: globalFilter ? { search: globalFilter } : undefined,
      sort,
      direction,
    };
  }, [page, pageSize, globalFilter, sorting]);

  const { data } = useFaqsControllerGetAdminFaqs(queryParams);

  const faqs = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const columns = useMemo(() => [
    columnHelper.accessor('category', {
      header: t('faq.category'),
      cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      size: 130,
    }),
    columnHelper.accessor('question', {
      header: t('faq.question'),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{row.original.question}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.answer}</div>
        </div>
      ),
      size: 380,
    }),
    columnHelper.accessor('order', {
      header: t('faq.order'),
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
      size: 90,
    }),
    columnHelper.accessor('isPublished', {
      header: t('faq.isPublished'),
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? 'default' : 'outline'}>
          {getValue() ? t('faq.published') : t('faq.unpublished')}
        </Badge>
      ),
      size: 100,
    }),
    columnHelper.accessor('helpfulCount', {
      header: t('faq.helpfulCount'),
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="size-3" />
          <span>{getValue()}</span>
        </div>
      ),
      size: 100,
    }),
    columnHelper.accessor('createdAt', {
      header: t('notices.createdAt'),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString(dateLocale)}
        </span>
      ),
      size: 130,
    }),
    columnHelper.display({
      id: 'actions',
      header: t('notices.actions'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingFaq(row.original);
              setEditorOpen(true);
            }}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t('notices.edit')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setDeletingFaq(row.original);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4 text-destructive" />
            <span className="sr-only">{t('notices.delete')}</span>
          </Button>
        </div>
      ),
      size: 90,
    }),
  ], [dateLocale, t]);

  const table = useDataGrid({
    client: false,
    data: faqs,
    columns,
    rowCount: totalCount,
    pageCount: totalPages,
    initialState: {
      pagination: { pageIndex: page - 1, pageSize },
      sorting,
    },
    onPaginationChange: (nextPagination: PaginationState) => {
      setPage(nextPagination.pageIndex + 1);
      setPageSize(nextPagination.pageSize);
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: (value: string) => {
      setGlobalFilter(value);
      setPage(1);
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      <div className="
        flex flex-col gap-4
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div>
          <h1 className="
            flex items-center gap-2 text-2xl font-bold tracking-tight
          "
          >
            <MessageSquareQuote className="size-6 text-primary" />
            {t('faq.managementTitle')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('faq.managementDescription')}</p>
        </div>
        <Button
          onClick={() => {
            setEditingFaq(null);
            setEditorOpen(true);
          }}
          className="
            gap-2 self-start
            sm:self-auto
          "
        >
          <Plus className="size-4" />
          {t('faq.createFaq')}
        </Button>
      </div>

      <Card className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden">
        <CardHeader className="shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('notices.listTitle')}</CardTitle>
            <CardDescription>{t('faq.totalCount', { count: totalCount })}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="
          grid min-h-0 grid-rows-[auto_1fr] overflow-hidden p-0
        "
        >
          <DataGridToolbar table={table} filterPlaceholder={t('faq.searchPlaceholder')} searchOnly />
          <div className="min-h-0 flex-1">
            <DataGrid table={table} />
          </div>
        </CardContent>
        <div className="border-t p-4">
          <DataTablePagination table={table} />
        </div>
      </Card>

      <FaqEditorDialog
        open={editorOpen}
        faq={editingFaq}
        onOpenChange={setEditorOpen}
      />

      <FaqDeleteDialog
        open={deleteOpen}
        faq={deletingFaq}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
