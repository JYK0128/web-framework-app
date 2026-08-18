import { useI18n } from '@pkg/shared/web';
import { infiniteQueryOptions, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, type Row, type SortingState } from '@tanstack/react-table';
import { Eye, Megaphone } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getNoticesControllerGetNoticeFeedQueryKey, noticesControllerGetNoticeFeed, useNoticesControllerMarkNoticeRead } from '#/.generated/api/endpoints/notices/notices';
import type { NoticeFeedItemDto, NoticesControllerGetNoticeFeedDirectionItem, NoticesControllerGetNoticeFeedParams, NoticesControllerGetNoticeFeedSortItem } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { NoticeDetailDialog } from '#/components/app';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';

const PAGE_SIZE = 20;
const columnHelper = createColumnHelper<NoticeFeedItemDto>();
const EMPTY_ROWS: NoticeFeedItemDto[] = [];
const DEFAULT_SORTING: SortingState = [
  { id: 'priority', desc: true },
  { id: 'publishedAt', desc: true },
  { id: 'id', desc: false },
];

type NoticeFeedQuery = {
  globalFilter: string
  sorting: SortingState
};

export const Route = createFileRoute('/_protected/_app/announcements/')({
  component: AnnouncementsPageComponent,
});

function noticeFeedQuery({ globalFilter, sorting }: NoticeFeedQuery) {
  const { sort, direction } = toFeedSort(sorting);
  const params: NoticesControllerGetNoticeFeedParams = {
    limit: PAGE_SIZE,
    search: globalFilter || undefined,
    sort,
    direction,
  };

  return infiniteQueryOptions({
    queryKey: getNoticesControllerGetNoticeFeedQueryKey(params),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => noticesControllerGetNoticeFeed({
      ...params,
      cursor: pageParam,
    }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined),
  });
}

function AnnouncementsPageComponent() {
  const { language, t } = useI18n();
  const locale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  const queryClient = useQueryClient();
  const markReadMutation = useNoticesControllerMarkNoticeRead();
  const [selectedNotice, setSelectedNotice] = useState<NoticeFeedItemDto | null>(null);

  const handleRowClick = useCallback((row: Row<NoticeFeedItemDto>) => {
    setSelectedNotice(row.original);
    if (row.original.isRead) return;

    void markReadMutation.mutateAsync({ id: row.original.id })
      .then(async () => {
        setSelectedNotice((current) => (current?.id === row.original.id ? { ...current, isRead: true } : current));
        await queryClient.invalidateQueries({ queryKey: getNoticesControllerGetNoticeFeedQueryKey() });
      })
      .catch(() => undefined);
  }, [markReadMutation, queryClient]);

  const columns = useMemo(() => [
    columnHelper.accessor('title', {
      header: t('notices.titleField'),
      cell: ({ row }) => {
        const isUnread = !row.original.isRead;

        return (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 items-center gap-1">
              {row.original.priority === 2 && <Badge variant="destructive">{t('notices.urgent')}</Badge>}
              {row.original.priority === 1 && <Badge variant="outline">{t('notices.important')}</Badge>}
              {row.original.priority === 0 && <Badge variant="secondary">{t('notices.normal')}</Badge>}
            </div>
            <span
              className={cn(
                'truncate text-foreground',
                isUnread ? 'font-bold' : 'font-normal',
              )}
            >
              {row.original.title}
            </span>
          </div>
        );
      },
      size: 580,
    }),
    columnHelper.accessor('publishedAt', {
      header: t('notices.publishedAt'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={locale} />,
      size: 170,
    }),
    columnHelper.accessor('expiresAt', {
      header: t('notices.expiresAtField'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={locale} />,
      size: 170,
    }),
    columnHelper.display({
      id: 'actions',
      header: t('common.manage'),
      enableSorting: false,
      size: 80,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row);
            }}
            title={t('notices.viewDetails')}
            aria-label={t('notices.viewDetails')}
          >
            <Eye className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
        </div>
      ),
    }),
  ], [handleRowClick, locale, t]);

  const table = useDataGrid({
    client: false,
    cursor: true,
    data: EMPTY_ROWS,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    defaultColumn: { size: 140 },
    initialState: { sorting: DEFAULT_SORTING },
    getRowId: (row) => row.id,
  });
  const tableState = table.getState();
  const globalFilter = typeof tableState.globalFilter === 'string' ? tableState.globalFilter : '';
  const query = noticeFeedQuery({ globalFilter, sorting: tableState.sorting });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(query);
  const notices = data?.pages.flatMap((page) => page.items) ?? EMPTY_ROWS;
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const unreadCount = notices.filter((notice) => !notice.isRead).length;
  const loadMore = useCallback(() => {
    if (isFetchingNextPage) return;
    return fetchNextPage().then(() => undefined);
  }, [fetchNextPage, isFetchingNextPage]);

  // DataGrid owns sorting and filtering state; the infinite query owns cursor pages.
  table.setOptions((options) => ({ ...options, data: notices }));

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
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
            <Megaphone className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('notices.boardTitle')}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('notices.boardDescription')}</p>
      </div>
      <Card className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">{t('notices.listTitle')}</CardTitle>
              <CardDescription>{t('notices.totalCount', { count: totalCount })}</CardDescription>
            </div>
            {unreadCount > 0 && <Badge variant="secondary">{t('notices.unreadCount', { count: unreadCount })}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="
          grid min-h-0 grid-rows-[auto_1fr] overflow-hidden p-0
        "
        >
          <DataGridToolbar table={table} searchPlaceholder={t('notices.searchPlaceholder')} searchOnly />
          <div className="min-h-0 flex-1">
            <DataGrid
              table={table}
              hasMore={hasNextPage}
              onScrollEnd={loadMore}
              onRowClick={handleRowClick}
            />
          </div>
        </CardContent>
      </Card>
      <NoticeDetailDialog
        open={Boolean(selectedNotice)}
        notice={selectedNotice}
        onOpenChange={(open) => !open && setSelectedNotice(null)}
      />
    </div>
  );
}

function DateCell({ value, locale }: { value: string | null, locale: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {value ? new Date(value).toLocaleString(locale) : '-'}
    </span>
  );
}

function toFeedSort(sorting: SortingState): {
  sort: NoticesControllerGetNoticeFeedSortItem[]
  direction: NoticesControllerGetNoticeFeedDirectionItem[]
} {
  const supportedSorting = sorting;
  const nextSorting = supportedSorting.length > 0 ? supportedSorting : DEFAULT_SORTING;
  const sort = nextSorting.map(({ id }) => id as NoticesControllerGetNoticeFeedSortItem);
  const direction = nextSorting.map(({ desc }) => (desc ? 'desc' : 'asc'));

  if (!sort.includes('id')) {
    sort.push('id');
    direction.push('asc');
  }

  return { sort, direction };
}
