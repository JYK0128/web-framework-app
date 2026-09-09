import { createColumnHelper } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import type { LogItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

import { logMethodVariants, METHOD_OPTIONS, STATUS_OPTIONS, toLogMethodVariant } from './log.config';

const columnHelper = createColumnHelper<LogItemDto>();

export type LogColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onSelectLog: (log: LogItemDto) => void
};

export function createLogColumns({ i18n, onSelectLog }: LogColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  return [
    columnHelper.accessor('createdAt', {
      header: translate('logManagement.columns.timestamp'),
      size: 170,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }).format(new Date(getValue()))}
        </span>
      ),
    }),
    columnHelper.accessor('method', {
      header: translate('logManagement.columns.method'),
      size: 100,
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterOptions: METHOD_OPTIONS.filter((m) => m !== 'ALL').map((m) => ({ label: m, value: m })),
      },
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        const rowValue = row.getValue<string>(id);
        return Array.isArray(value) ? value.includes(rowValue) : rowValue === String(value);
      },
      cell: ({ getValue }) => {
        const method = getValue();
        return <span className={logMethodVariants({ method: toLogMethodVariant(method), className: 'inline-block rounded-sm text-xs' })}>{method}</span>;
      },
    }),
    columnHelper.accessor('statusCode', {
      header: translate('logManagement.columns.status'),
      size: 100,
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterOptions: STATUS_OPTIONS.filter((s) => s !== 'ALL').map((s) => ({
          label: translate(`logManagement.filters.statuses.${s}`),
          value: s,
        })),
      },
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        const rowValue = String(row.getValue<number>(id));
        return Array.isArray(value) ? value.includes(rowValue) : rowValue === String(value);
      },
      cell: ({ getValue }) => {
        const statusCode = getValue();
        return (
          <span className={`
            font-mono text-xs font-semibold
            ${statusCode >= 200 && statusCode < 400
            ? `text-emerald-500`
            : `text-rose-500`}
          `}
          >
            {statusCode}
          </span>
        );
      },
    }),
    columnHelper.accessor('url', {
      header: translate('logManagement.columns.url'),
      size: 320,
      cell: ({ row }) => (
        <span className="truncate font-mono text-xs font-medium text-foreground">
          {row.original.url}
        </span>
      ),
    }),
    columnHelper.accessor('duration', {
      header: translate('logManagement.columns.duration'),
      size: 100,
      cell: ({ getValue }) => {
        const duration = getValue();
        return (
          <span className={`
            font-mono text-xs
            ${duration > 500
            ? `font-semibold text-amber-500`
            : `text-muted-foreground`}
          `}
          >
            {duration}
            {' '}
            ms
          </span>
        );
      },
    }),
    columnHelper.accessor('ip', {
      header: translate('logManagement.columns.ip'),
      size: 130,
      cell: ({ getValue }) => (
        <span className="font-mono text-2xs text-muted-foreground">
          {getValue() || '-'}
        </span>
      ),
    }),
    columnHelper.accessor('emailHash', {
      header: translate('logManagement.columns.user'),
      size: 120,
      cell: ({ getValue }) => {
        const emailHash = getValue();
        return emailHash
          ? (
            <span
              className="font-mono text-2xs text-muted-foreground"
              title={emailHash}
            >
              {emailHash.slice(0, 8)}
              ...
            </span>
          )
          : (
            <span className="text-2xs text-muted-foreground/40">
              -
            </span>
          );
      },
    }),
    columnHelper.accessor('id', {
      id: 'actions',
      header: translate('logManagement.manage'),
      enableSorting: false,
      size: 80,
      cell: ({ row }) => (
        <div className="text-right" onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="icon" title={translate('logManagement.columns.detail')} aria-label={translate('logManagement.columns.detail')} onClick={() => onSelectLog(row.original)}>
            <Eye className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
        </div>
      ),
    }),
  ];
}
