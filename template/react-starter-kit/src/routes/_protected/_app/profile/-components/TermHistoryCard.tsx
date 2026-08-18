import { useI18n } from '@pkg/shared/web';
import { type InfiniteData, infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';

import { termsControllerGetTermHistoryCursor } from '#/.generated/api/endpoints/terms/terms';
import type { GetTermHistoryCursorResponseDto, TermDto, TermsControllerGetTermHistoryCursorParams } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';

import { UserTermDetailDialog } from './UserTermDetailDialog';

const PAGE_SIZE = 10;
const EMPTY_ROWS: TermDto[] = [];
type CursorResponse = GetTermHistoryCursorResponseDto;

type Translator = ReturnType<typeof useI18n>['t'];

function createColumns(t: Translator, locale: string, onSelectTerm: (term: TermDto) => void): ColumnDef<TermDto>[] {
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
      size: 320,
      cell: ({ getValue }) => {
        const content = getValue<string>();
        return <span className="truncate" title={content}>{content}</span>;
      },
    },
    {
      id: 'actions',
      header: t('common.manage'),
      size: 80,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTerm(row.original);
            }}
            title={t('terms.view')}
            aria-label={t('terms.view')}
          >
            <Eye className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
        </div>
      ),
    },
  ];
}

export function TermHistoryCard() {
  const { t } = useI18n();

  return (
    <Card className="p-6">
      <CardHeader className="gap-1 p-0">
        <CardTitle>{t('profile.versionHistoryTitle')}</CardTitle>
        <CardDescription>
          {t('profile.versionHistoryDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-0">
        <CursorHistoryGrid />
      </CardContent>
    </Card>
  );
}

function CursorHistoryGrid() {
  const { i18n, t } = useI18n();
  const [version, setVersion] = useState<string | undefined>();
  const [selectedTerm, setSelectedTerm] = useState<TermDto | null>(null);

  const columns = useMemo(
    () => createColumns(t, i18n.language, (term) => setSelectedTerm(term)),
    [i18n.language, t],
  );

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
    enableColumnFilters: false,
    enablePinning: false,
    getRowId: (row) => row.id,
    onGlobalFilterChange: (value) => {
      const nextVersion = typeof value === 'string' ? value.trim() : '';
      setVersion(nextVersion || undefined);
    },
  });

  return (
    <div className="
      grid h-[460px] grid-rows-[auto_1fr] overflow-hidden rounded-lg border
    "
    >
      <DataGridToolbar
        table={table}
        searchPlaceholder={t('profile.versionPlaceholder')}
        onReset={() => setVersion(undefined)}
      />
      <div className="min-h-0 flex-1">
        <DataGrid
          table={table}
          hasMore={response.hasNextPage}
          onScrollEnd={() => response.fetchNextPage().then(() => undefined)}
          onRowClick={(row) => setSelectedTerm(row.original)}
        />
      </div>

      <UserTermDetailDialog
        open={Boolean(selectedTerm)}
        term={selectedTerm}
        onOpenChange={(open) => !open && setSelectedTerm(null)}
      />
    </div>
  );
}

function formatDate(value: string | null, locale: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale.startsWith('ko') ? 'ko-KR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
