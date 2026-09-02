import { createColumnHelper, type Row } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { type NoticeFeedItemDto, NoticePriority } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

const columnHelper = createColumnHelper<NoticeFeedItemDto>();

type NoticeFeedColumnsProps = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onSelectNotice: (row: Row<NoticeFeedItemDto>) => void
};

export function createNoticeFeedColumns({ i18n, onSelectNotice }: NoticeFeedColumnsProps) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const t = i18n.getFixedT(language);

  return [
    columnHelper.accessor('title', {
      header: t('notices.titleField'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-1">
            {row.original.priority === NoticePriority.HIGH && <Badge variant="destructive">{t('notices.urgent')}</Badge>}
            {row.original.priority === NoticePriority.NORMAL && <Badge variant="outline">{t('notices.important')}</Badge>}
            {row.original.priority === NoticePriority.LOW && <Badge variant="secondary">{t('notices.normal')}</Badge>}
          </div>
          <span className="truncate font-medium text-foreground">{row.original.title}</span>
        </div>
      ),
      size: 580,
    }),
    columnHelper.accessor('publishedAt', {
      header: t('notices.publishedAt'),
      cell: ({ getValue }) => {
        const value = getValue();

        return (
          <span className="text-xs text-muted-foreground">
            {value
              ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
              : '-'}
          </span>
        );
      },
      size: 170,
    }),
    columnHelper.accessor('expiresAt', {
      header: t('notices.expiresAtField'),
      cell: ({ getValue }) => {
        const value = getValue();

        return (
          <span className="text-xs text-muted-foreground">
            {value
              ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
              : '-'}
          </span>
        );
      },
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
            onClick={(event) => {
              event.stopPropagation();
              onSelectNotice(row);
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
  ];
}
