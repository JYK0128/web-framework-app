import { useI18n } from '@pkg/shared/web';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { useTermsControllerGetAgreementHistory } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementHistoryItemDto } from '#/.generated/api/model';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';

const EMPTY_ROWS: AgreementHistoryItemDto[] = [];

type Translator = ReturnType<typeof useI18n>['t'];

function createColumns(t: Translator, locale: string): ColumnDef<AgreementHistoryItemDto>[] {
  return [
    { accessorKey: 'code', header: t('profile.codeColumn'), size: 150 },
    { accessorKey: 'title', header: t('profile.termsNameColumn'), size: 220 },
    { accessorKey: 'version', header: t('profile.versionColumn'), size: 110 },
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
      accessorKey: 'isAgreed',
      header: t('profile.agreementStatus'),
      size: 110,
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'default' : 'outline'}>
          {getValue<boolean>() ? t('profile.agreementComplete') : t('profile.notAgreed')}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('profile.agreementChangedAt'),
      size: 190,
      cell: ({ getValue }) => formatDate(getValue<string>(), locale),
    },
  ];
}

export function AgreementHistoryCard() {
  const { i18n, t } = useI18n();
  const response = useTermsControllerGetAgreementHistory();
  const columns = useMemo(() => createColumns(t, i18n.language), [i18n.language, t]);
  const rows = response.data?.items ?? EMPTY_ROWS;
  const table = useDataGrid({
    data: rows,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    getRowId: (row) => row.id,
  });

  return (
    <Card className="p-6">
      <CardHeader className="gap-1 p-0">
        <CardTitle>{t('profile.agreementHistoryTitle')}</CardTitle>
        <CardDescription>
          {t('profile.agreementHistoryDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="
        grid h-[460px] grid-rows-[auto_auto_1fr] overflow-hidden p-0
      "
      >
        <DataGridToolbar
          table={table}
          searchPlaceholder={t('profile.termsNameColumn')}
        />
        <HistoryStatus
          isError={response.isError}
          isLoading={response.isLoading}
          message={t('profile.agreementHistoryTitle')}
        />
        <div className="min-h-0">
          <DataGrid table={table} />
        </div>
      </CardContent>
    </Card>
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

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(
    locale.startsWith('ko') ? 'ko-KR' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' },
  ).format(new Date(value));
}
