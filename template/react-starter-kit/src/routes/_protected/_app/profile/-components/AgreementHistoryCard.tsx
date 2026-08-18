import { useI18n } from '@pkg/shared/web';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTermsControllerGetAgreementHistory } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementHistoryItemDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';

import { UserTermDetailDialog } from './UserTermDetailDialog';

const EMPTY_ROWS: AgreementHistoryItemDto[] = [];

type Translator = ReturnType<typeof useI18n>['t'];

function createColumns(
  t: Translator,
  locale: string,
  onSelectTerm: (item: AgreementHistoryItemDto) => void,
): ColumnDef<AgreementHistoryItemDto>[] {
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

export function AgreementHistoryCard() {
  const { i18n, t } = useI18n();
  const [selectedTerm, setSelectedTerm] = useState<AgreementHistoryItemDto | null>(null);
  const response = useTermsControllerGetAgreementHistory();
  const columns = useMemo(
    () => createColumns(t, i18n.language, (item) => setSelectedTerm(item)),
    [i18n.language, t],
  );
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
        grid h-[460px] grid-rows-[auto_1fr] overflow-hidden p-0
      "
      >
        <DataGridToolbar
          table={table}
          searchPlaceholder={t('profile.termsNameColumn')}
        />
        <div className="min-h-0">
          <DataGrid
            table={table}
            onRowClick={(row) => setSelectedTerm(row.original)}
          />
        </div>

        <UserTermDetailDialog
          open={Boolean(selectedTerm)}
          term={selectedTerm}
          onOpenChange={(open) => !open && setSelectedTerm(null)}
        />
      </CardContent>
    </Card>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(
    locale.startsWith('ko') ? 'ko-KR' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' },
  ).format(new Date(value));
}
