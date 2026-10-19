import { createColumnHelper } from '@tanstack/react-table';
import { Eye, Trash2 } from 'lucide-react';

import type { SupportTicketItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';
import { SupportTicketPriorityBadge, SupportTicketStatusBadge } from '#/routes/_protected/_app/support/-components/support-ticket-badges';

const columnHelper = createColumnHelper<SupportTicketItemDto>();

type SupportManagementColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onSelect: (ticket: SupportTicketItemDto) => void
  onDelete: (ticket: SupportTicketItemDto) => void
};

export function createSupportManagementColumns({ i18n, onSelect, onDelete }: SupportManagementColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  return [
    columnHelper.accessor('userName', {
      header: translate('supportManagement.user'),
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      size: 140,
    }),
    columnHelper.accessor('category', {
      header: translate('supportManagement.category'),
      cell: ({ getValue }) => <Badge variant="secondary" className="font-normal">{getValue()}</Badge>,
      size: 130,
    }),
    columnHelper.accessor('title', {
      header: translate('supportManagement.title'),
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.content}</div>
        </div>
      ),
      size: 360,
    }),
    columnHelper.accessor('priority', {
      header: translate('supportManagement.priority'),
      cell: ({ getValue }) => <SupportTicketPriorityBadge priority={getValue()} />,
      size: 100,
    }),
    columnHelper.accessor('status', {
      header: translate('supportManagement.status'),
      cell: ({ getValue }) => <SupportTicketStatusBadge status={getValue()} />,
      size: 120,
    }),
    columnHelper.accessor('assigneeName', {
      header: translate('supportManagement.assignee'),
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() ?? translate('supportManagement.unassigned')}</span>,
      size: 130,
    }),
    columnHelper.accessor('createdAt', {
      header: translate('supportManagement.createdAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString(dateLocale)}</span>,
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('supportManagement.manage'),
      enableSorting: false,
      size: 90,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title={translate('supportManagement.view')}
            aria-label={translate('supportManagement.view')}
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
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="
              text-destructive
              hover:text-destructive
            "
            title={translate('supportManagement.deleteTicket')}
            aria-label={translate('supportManagement.deleteTicket')}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row.original);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    }),
  ];
}
