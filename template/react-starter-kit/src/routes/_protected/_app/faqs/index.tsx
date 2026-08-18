import { useI18n } from '@pkg/shared/web';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type SortingState } from '@tanstack/react-table';
import { Eye, EyeOff, HelpCircle, MessageSquareQuote, Pencil, Plus, ThumbsUp, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useFaqsControllerGetAdminFaqs } from '#/.generated/api/endpoints/faqs/faqs';
import type { AdminFaqSortKey, FaqItemDto, FaqsControllerGetAdminFaqsParams, SortDirection } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';

import { FaqDeleteDialog } from './-components/FaqDeleteDialog';
import { FaqEditorDialog } from './-components/FaqEditorDialog';

export const Route = createFileRoute('/_protected/_app/faqs/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'faq:manage')) {
      throw notFound({ routeId: Route.id });
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      search: globalFilter || undefined,
      sort,
      direction,
      filters: selectedCategory !== 'all' ? { category: selectedCategory } : undefined,
    };
  }, [page, pageSize, globalFilter, sorting, selectedCategory]);

  const { data } = useFaqsControllerGetAdminFaqs(queryParams);

  const faqs = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const publishedCount = useMemo(() => faqs.filter((f) => f.isPublished).length, [faqs]);

  const categoryList = useMemo(() => [
    { key: 'all', label: t('faq.allCategories') },
    { key: t('faq.categories.account'), label: t('faq.categories.account') },
    { key: t('faq.categories.service'), label: t('faq.categories.service') },
    { key: t('faq.categories.billing'), label: t('faq.categories.billing') },
    { key: t('faq.categories.security'), label: t('faq.categories.security') },
    { key: t('faq.categories.etc'), label: t('faq.categories.etc') },
  ], [t]);

  const columns = useMemo(() => [
    columnHelper.accessor('order', {
      header: t('faq.order'),
      cell: ({ getValue }) => (
        <div className="flex items-center justify-center">
          <span className="
            inline-flex size-6 items-center justify-center rounded-full bg-muted
            font-mono text-xs font-semibold text-muted-foreground
          "
          >
            {getValue()}
          </span>
        </div>
      ),
      size: 70,
    }),
    columnHelper.accessor('category', {
      header: t('faq.category'),
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="font-normal">
          {getValue()}
        </Badge>
      ),
      size: 130,
    }),
    columnHelper.accessor('question', {
      header: t('faq.question'),
      cell: ({ row }) => (
        <div className="min-w-0 py-0.5">
          <div className="
            flex items-center gap-1.5 font-medium text-foreground truncate
          "
          >
            <HelpCircle className="size-3.5 shrink-0 text-primary/70" />
            <span className="truncate">{row.original.question}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground pl-5">
            {row.original.answer}
          </div>
        </div>
      ),
      size: 380,
    }),
    columnHelper.accessor('isPublished', {
      header: t('faq.isPublished'),
      cell: ({ getValue }) => {
        const isPublished = getValue();
        return isPublished
          ? (
            <Badge className="
              border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1
              font-normal
              dark:text-emerald-400
            "
            >
              <Eye className="size-3" />
              {t('faq.published')}
            </Badge>
          )
          : (
            <Badge
              variant="outline"
              className="text-muted-foreground gap-1 font-normal"
            >
              <EyeOff className="size-3" />
              {t('faq.unpublished')}
            </Badge>
          );
      },
      size: 110,
    }),
    columnHelper.accessor('helpfulCount', {
      header: t('faq.helpfulCount'),
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp className="size-3.5 text-muted-foreground/80" />
          <span className="font-medium">{getValue()}</span>
        </div>
      ),
      size: 90,
    }),
    columnHelper.accessor('createdAt', {
      header: t('notices.createdAt'),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString(dateLocale)}
        </span>
      ),
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: t('common.manage'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingFaq(row.original);
              setEditorOpen(true);
            }}
            title={t('faq.editFaq')}
            aria-label={t('faq.editFaq')}
          >
            <Pencil className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingFaq(row.original);
              setDeleteOpen(true);
            }}
            title={t('faq.deleteFaq')}
            aria-label={t('faq.deleteFaq')}
          >
            <Trash2 className="
              size-4 text-destructive/80
              hover:text-destructive
            "
            />
          </Button>
        </div>
      ),
      size: 80,
    }),
  ], [dateLocale, t]);

  const table = useDataGrid({
    client: false,
    data: faqs,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
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
              <MessageSquareQuote className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('faq.managementTitle')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('faq.managementDescription')}</p>
        </div>
        <Button
          onClick={() => {
            setEditingFaq(null);
            setEditorOpen(true);
          }}
          className="
            gap-2 self-start shadow-xs
            sm:self-auto
          "
        >
          <Plus className="size-4" />
          {t('faq.createFaq')}
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="
        grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden shadow-xs
      "
      >
        <CardHeader className="shrink-0 border-b pb-3">
          <div className="
            flex flex-col gap-3
            sm:flex-row sm:items-center sm:justify-between
          "
          >
            <div>
              <CardTitle className="text-base font-semibold">
                {t('faq.boardTitle')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('faq.totalCount', { count: totalCount })}
                {' · '}
                <span className="text-emerald-600 font-medium">
                  {t('faq.published')}
                  {' '}
                  {publishedCount}
                </span>
              </CardDescription>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categoryList.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setPage(1);
                    }}
                    className={`
                      rounded-md px-2.5 py-1 text-xs font-medium transition-all
                      ${isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : `
                      bg-muted/70 text-muted-foreground
                      hover:bg-muted hover:text-foreground
                    `}
                    `}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="
          grid min-h-0 grid-rows-[auto_1fr] overflow-hidden p-0
        "
        >
          <DataGridToolbar
            table={table}
            searchPlaceholder={t('faq.searchPlaceholder')}
            onReset={() => {
              setGlobalFilter('');
              setSelectedCategory('all');
              setPage(1);
            }}
          />
          <div className="min-h-0 flex-1">
            <DataGrid
              table={table}
              onRowClick={(row) => {
                setEditingFaq(row.original);
                setEditorOpen(true);
              }}
            />
          </div>
        </CardContent>
        <div className="border-t p-4">
          <DataTablePagination table={table} />
        </div>
      </Card>

      <FaqEditorDialog
        key={editorOpen ? (editingFaq?.id ?? 'new') : 'closed'}
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
