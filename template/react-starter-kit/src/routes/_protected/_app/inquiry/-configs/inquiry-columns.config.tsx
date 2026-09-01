import { useI18n } from '@pkg/shared/web';
import { createColumnHelper } from '@tanstack/react-table';
import { MessageSquare, Trash2 } from 'lucide-react';

import type { InquiryItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { InquiryStatusBadge } from '#/routes/_protected/_app/inquiry/-components/inquiry-status-badge';

const columnHelper = createColumnHelper<InquiryItemDto>();

type InquiryColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onSelectInquiry: (inquiry: InquiryItemDto) => void
  onDeleteInquiry: (inquiry: InquiryItemDto) => void
};

export function createInquiryColumns({ i18n, onSelectInquiry, onDeleteInquiry }: InquiryColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const locale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  return [
    columnHelper.accessor('category', {
      header: translate('inquiries.category'),
      cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      size: 140,
    }),
    columnHelper.accessor('title', {
      header: translate('inquiries.title'),
      cell: ({ row }) => (
        <div>
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.content}</div>
        </div>
      ),
      size: 400,
    }),
    columnHelper.accessor('status', {
      header: translate('inquiries.status'),
      cell: ({ getValue }) => <InquiryStatusBadge status={getValue()} />,
      size: 110,
    }),
    columnHelper.accessor('createdAt', {
      header: translate('inquiries.createdAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString(locale)}</span>,
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('common.manage'),
      enableSorting: false,
      size: 90,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title={translate('inquiries.view')}
            aria-label={translate('inquiries.view')}
            onClick={(event) => {
              event.stopPropagation();
              onSelectInquiry(row.original);
            }}
          >
            <MessageSquare className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
          {row.original.status === 'pending' && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={translate('inquiries.deleteInquiry')}
              aria-label={translate('inquiries.deleteInquiry')}
              className="
                text-destructive
                hover:text-destructive
              "
              onClick={(event) => {
                event.stopPropagation();
                onDeleteInquiry(row.original);
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
