import { createColumnHelper } from '@tanstack/react-table';
import { Eye, Trash2 } from 'lucide-react';

import type { SupportTicketItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';
import { SupportTicketStatusBadge } from '#/routes/_protected/_app/support/-components/support-ticket-badges';

const columnHelper = createColumnHelper<SupportTicketItemDto>();

type SupportTicketColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onSelect: (ticket: SupportTicketItemDto) => void
  onDelete: (ticket: SupportTicketItemDto) => void
};

export function createSupportTicketColumns({ i18n, onSelect, onDelete }: SupportTicketColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  return [
    columnHelper.accessor('category', {
      header: translate('support.category'),
      cell: ({ getValue }) => <Badge variant="secondary" className="font-normal">{getValue()}</Badge>,
      size: 130,
    }),
    columnHelper.accessor('title', {
      header: translate('support.title'),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.content}</div>
        </div>
      ),
      size: 460,
    }),
    columnHelper.accessor('status', {
      header: translate('support.status'),
      cell: ({ getValue }) => <SupportTicketStatusBadge status={getValue()} />,
      size: 120,
    }),
    columnHelper.accessor('createdAt', {
      header: translate('support.createdAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString(dateLocale)}</span>,
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('support.manage'),
      enableSorting: false,
      size: 90,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title={translate('support.view')}
            aria-label={translate('support.view')}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(row.original);
            }}
          >
            <Eye className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
          {row.original.status === 'open' && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="
                text-destructive
                hover:text-destructive
              "
              title={translate('support.deleteTicket')}
              aria-label={translate('support.deleteTicket')}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(row.original);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ),
    }),
  ];
}
