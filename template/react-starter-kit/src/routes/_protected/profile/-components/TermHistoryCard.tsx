import { useI18n } from '@pkg/shared/web';
import { type InfiniteData, infiniteQueryOptions, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { termsControllerGetTermHistoryCursor, useTermsControllerGetTermHistoryPage } from '#/.generated/api/endpoints/terms/terms';
import type { TermDto, TermsControllerGetTermHistoryCursor200, TermsControllerGetTermHistoryCursorParams, TermsControllerGetTermHistoryPageParams } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataTablePagination, useDataGrid } from '#/components/data-grid';

const PAGE_SIZE = 10;
const EMPTY_ROWS: TermDto[] = [];
type CursorResponse = TermsControllerGetTermHistoryCursor200;

type ViewMode = 'page' | 'cursor';

type Translator = ReturnType<typeof useI18n>['t'];

function createColumns(t: Translator, locale: string): ColumnDef<TermDto>[] {
  return [
    { accessorKey: 'code', header: t('profile.codeColumn'), size: 150 },
    { accessorKey: 'title', header: t('profile.termsNameColumn'), size: 220 },
    { accessorKey: 'version', header: t('profile.versionColumn'), size: 110 },
    {
      accessorKey: 'publishedAt',
      header: t('profile.publishedAtColumn'),
      size: 180,
      cell: ({ getValue }) => formatDate(getValue<string | null>(), locale),
    },
    {
      accessorKey: 'isRequired',
      header: t('onboarding.required'),
      size: 90,
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'default' : 'secondary'}>
          {getValue<boolean>() ? t('onboarding.required') : t('onboarding.optional')}
        </Badge>
      ),
    },
    {
      accessorKey: 'content',
      header: t('profile.contentColumn'),
      size: 360,
      cell: ({ getValue }) => {
        const content = getValue<string>();
        return <span title={content}>{content}</span>;
      },
    },
  ];
}

export function TermHistoryCard() {
  const [mode, setMode] = useState<ViewMode>('page');
  const [versionInput, setVersionInput] = useState('');
  const [version, setVersion] = useState<string | undefined>();
  const { i18n, t } = useI18n();
  const columns = useMemo(() => createColumns(t, i18n.language), [i18n.language, t]);

  return (
    <Card className="p-6">
      <CardHeader className="gap-1 p-0">
        <CardTitle>{t('profile.historyTitle')}</CardTitle>
        <CardDescription>
          {t('profile.historyDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-0">
        <form
          className="flex max-w-md items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const nextVersion = versionInput.trim();
            setVersion(nextVersion || undefined);
          }}
        >
          <label className="flex-1 space-y-1 text-sm font-medium" htmlFor="term-history-version">
            {t('profile.versionFilter')}
            <Input
              id="term-history-version"
              value={versionInput}
              onChange={(event) => setVersionInput(event.target.value)}
              placeholder={t('profile.versionPlaceholder')}
            />
          </label>
          <Button type="submit">{t('profile.lookup')}</Button>
        </form>

        <Tabs
          className="min-h-0"
          value={mode}
          onValueChange={(value) => setMode(value as ViewMode)}
        >
          <TabsList variant="line" className="w-full justify-start border-b p-0">
            <TabsTrigger value="page">{t('profile.pageResponse')}</TabsTrigger>
            <TabsTrigger value="cursor">{t('profile.cursorResponse')}</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-4 min-h-0" value="page">
            <PageHistoryGrid active={mode === 'page'} key={version ?? 'all'} version={version} columns={columns} />
          </TabsContent>
          <TabsContent className="mt-4 min-h-0" value="cursor">
            <CursorHistoryGrid active={mode === 'cursor'} version={version} columns={columns} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PageHistoryGrid({ active, version, columns }: { active: boolean, version?: string, columns: ColumnDef<TermDto>[] }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const params = useMemo<TermsControllerGetTermHistoryPageParams>(() => ({
    page,
    limit: pageSize,
    filters: version ? { version } : undefined,
    sort: ['publishedAt', 'id'],
    direction: ['desc', 'asc'],
  }), [page, pageSize, version]);
  const response = useTermsControllerGetTermHistoryPage(params, {
    query: {
      enabled: active,
      placeholderData: keepPreviousData,
    },
  });
  const data = response.data?.data;
  const table = useDataGrid({
    client: false,
    data: data?.items ?? EMPTY_ROWS,
    columns,
    rowCount: data?.totalCount ?? 0,
    initialState: { pagination: { pageIndex: page - 1, pageSize } },
    getRowId: (row) => row.id,
    onPaginationChange: ({ pageIndex, pageSize: nextPageSize }) => {
      setPage(pageIndex + 1);
      setPageSize(nextPageSize);
    },
  });

  return (
    <div className="
      flex h-[460px] min-h-0 flex-col overflow-hidden rounded-lg border
    "
    >
      <HistoryStatus isError={response.isError} isLoading={response.isFetching} message={t('profile.pageResponse')} />
      <div className="min-h-0 flex-1">
        <DataGrid table={table} />
      </div>
      <DataTablePagination table={table} rowCount={data?.totalCount ?? 0} />
    </div>
  );
}

function CursorHistoryGrid({ active, version, columns }: { active: boolean, version?: string, columns: ColumnDef<TermDto>[] }) {
  const { t } = useI18n();
  const params = useMemo<Omit<TermsControllerGetTermHistoryCursorParams, 'cursor'>>(() => ({
    limit: PAGE_SIZE,
    filters: version ? { version } : undefined,
    sort: ['publishedAt', 'id'],
    direction: ['desc', 'asc'],
  }), [version]);
  const query = useMemo(() => infiniteQueryOptions<
    CursorResponse,
    Error,
    InfiniteData<CursorResponse, string | null>,
    readonly ['terms-history-cursor', typeof params],
    string | null
  >({
    queryKey: ['terms-history-cursor', params] as const,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }): Promise<CursorResponse> => termsControllerGetTermHistoryCursor({
      ...params,
      cursor: pageParam ?? undefined,
    }, undefined, signal),
    getNextPageParam: (lastPage: CursorResponse) => {
      const data = lastPage.data;
      return data.hasNextPage ? data.endCursor ?? undefined : undefined;
    },
  }), [params]);
  const response = useInfiniteQuery({ ...query, enabled: active });
  const rows = response.data?.pages.flatMap((page) => page.data.items) ?? EMPTY_ROWS;
  const table = useDataGrid({
    client: false,
    cursor: true,
    data: rows,
    columns,
    getRowId: (row) => row.id,
  });

  return (
    <div className="
      flex h-[460px] min-h-0 flex-col overflow-hidden rounded-lg border
    "
    >
      <HistoryStatus isError={response.isError} isLoading={response.isFetchingNextPage} message={t('profile.cursorResponse')} />
      <div className="min-h-0 flex-1">
        <DataGrid
          table={table}
          hasMore={response.hasNextPage}
          onScrollEnd={() => response.fetchNextPage().then(() => undefined)}
        />
      </div>
    </div>
  );
}

function HistoryStatus({ isError, isLoading, message }: {
  isError: boolean
  isLoading: boolean
  message: string
}) {
  const { t } = useI18n();
  let status = t('profile.latestStatus');
  if (isLoading) status = t('profile.querying');
  if (isError) status = t('profile.queryFailed');

  return (
    <div className="
      flex min-h-8 items-center justify-between border-b bg-muted/30 px-4
      text-xs text-muted-foreground
    "
    >
      <span>{message}</span>
      <span>{status}</span>
    </div>
  );
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale.startsWith('ko') ? 'ko-KR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
