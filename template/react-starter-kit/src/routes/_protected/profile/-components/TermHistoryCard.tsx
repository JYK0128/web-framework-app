import { useI18n } from '@pkg/shared/web';
import { type InfiniteData, infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { termsControllerGetTermHistoryCursor } from '#/.generated/api/endpoints/terms/terms';
import type { GetTermHistoryCursorResponseDto, TermDto, TermsControllerGetTermHistoryCursorParams } from '#/.generated/api/model';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';

const PAGE_SIZE = 10;
const EMPTY_ROWS: TermDto[] = [];
type CursorResponse = GetTermHistoryCursorResponseDto;

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
        <CursorHistoryGrid columns={columns} />
      </CardContent>
    </Card>
  );
}

function CursorHistoryGrid({ columns }: { columns: ColumnDef<TermDto>[] }) {
  const { t } = useI18n();
  const [version, setVersion] = useState<string | undefined>();
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
      return lastPage.hasNextPage ? lastPage.endCursor ?? undefined : undefined;
    },
  }), [params]);
  const response = useInfiniteQuery(query);
  const rows = response.data?.pages.flatMap((page) => page.items) ?? EMPTY_ROWS;
  const table = useDataGrid({
    client: false,
    cursor: true,
    data: rows,
    columns,
    getRowId: (row) => row.id,
    onGlobalFilterChange: (value) => {
      const nextVersion = typeof value === 'string' ? value.trim() : '';
      setVersion(nextVersion || undefined);
    },
  });

  return (
    <div className="
      grid h-[460px] grid-rows-[auto_auto_1fr] overflow-hidden rounded-lg border
    "
    >
      <DataGridToolbar
        table={table}
        filterPlaceholder={t('profile.versionPlaceholder')}
        onReset={() => setVersion(undefined)}
      />
      <HistoryStatus isError={response.isError} isLoading={response.isFetchingNextPage} message={t('profile.cursorResponse')} />
      <div className="flex-1">
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
