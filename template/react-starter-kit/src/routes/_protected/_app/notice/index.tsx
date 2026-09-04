import { valueIf } from '@pkg/shared/common';
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { type Row, type SortingState } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';

import { getNoticesControllerGetNoticeFeedQueryKey, noticesControllerGetNoticeFeed } from '#/.generated/api/endpoints/notices/notices';
import type { NoticeFeedItemDto, NoticesControllerGetNoticeFeedParams, NoticesControllerGetNoticeFeedSortItem } from '#/.generated/api/model';
import { cn } from '#/.generated/shadcn/lib/utils';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { openDialog } from '#/components/dialog';
import { PageSection, SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

import { NoticeDetailDialog } from './-components/notice-detail-dialog';
import { DEFAULT_SORTING, PAGE_SIZE } from './-configs/notice-feed.config';
import { createNoticeFeedColumns } from './-configs/notice-feed-columns.config';

type NoticeFeedQuery = {
  globalFilter: string
  sorting: SortingState
};

export const Route = createFileRoute('/_protected/_app/notice/')({
  validateSearch: z.object({
    noticeId: z.string().optional(),
  }),
  component: AnnouncementsPageComponent,
});

function noticeFeedQuery({ globalFilter, sorting }: NoticeFeedQuery) {
  const nextSorting = sorting.length > 0 ? sorting : DEFAULT_SORTING;
  const sort = nextSorting.map(({ id }) => id as NoticesControllerGetNoticeFeedSortItem);
  const direction = nextSorting.map(({ desc }) => desc ? 'desc' : 'asc');
  if (!sort.includes('id')) {
    sort.push('id');
    direction.push('asc');
  }
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
    getNextPageParam: (lastPage) => valueIf(Boolean(lastPage.hasNextPage && lastPage.endCursor), lastPage.endCursor),
  });
}

function AnnouncementsPageComponent() {
  const { i18n, t } = useI18n();
  const { noticeId } = Route.useSearch();

  const handleRowClick = useCallback((row: Row<NoticeFeedItemDto>) => {
    void openDialog(NoticeDetailDialog, { notice: row.original }, { dialogId: `notice-${row.original.id}` });
  }, []);

  const columns = useMemo(
    () => createNoticeFeedColumns({ i18n, onSelectNotice: handleRowClick }),
    [handleRowClick, i18n],
  );

  const table = useDataGrid({
    client: false,
    cursor: true,
    data: [],
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
  const notices = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data?.pages]);
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const loadMore = useCallback(() => {
    if (isFetchingNextPage) return;
    return fetchNextPage().then(() => undefined);
  }, [fetchNextPage, isFetchingNextPage]);

  // noticeId 쿼리 파라미터가 있는 경우 초기 오픈
  useEffect(() => {
    if (!noticeId || notices.length === 0) return;
    const target = notices.find((n) => n.id === noticeId);
    if (target) {
      void openDialog(NoticeDetailDialog, { notice: target }, { dialogId: `notice-${target.id}` });
    }
  }, [noticeId, notices]);

  return (
    <PageSection
      icon="megaphone"
      title={t('notice.boardTitle')}
      description={t('notice.boardDescription')}
    >
      <PageSection.Content className={cn(
        'grid grid-rows-[minmax(0,1fr)] p-2',
      )}
      >
        <SectionCard
          textSize="base"
          title={t('notice.listTitle')}
          description={t('notice.totalCount', { count: totalCount })}
        >
          <SectionCard.Content className={cn(
            'grid grid-rows-[auto_1fr]',
          )}
          >
            <DataGridToolbar table={table} searchPlaceholder={t('notice.searchPlaceholder')} searchOnly />
            <DataGrid
              table={table}
              hasMore={hasNextPage}
              onScrollEnd={loadMore}
              onRowClick={handleRowClick}
            />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
