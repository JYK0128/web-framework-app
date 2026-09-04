import { createColumnHelper } from '@tanstack/react-table';
import { MessageSquare, Trash2 } from 'lucide-react';

import type { InquiryItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';
import { InquiryStatusBadge } from '#/routes/_protected/_app/inquiry/-components/inquiry-status-badge';

const columnHelper = createColumnHelper<InquiryItemDto>();

type InquiryManagementColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onSelectInquiry: (inquiry: InquiryItemDto) => void
  onDeleteInquiry: (inquiry: InquiryItemDto) => void
};

export function createInquiryManagementColumns({ i18n, onSelectInquiry, onDeleteInquiry }: InquiryManagementColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const locale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  return [
    columnHelper.accessor('userName', {
      header: translate('inquiryManagement.user'),
      cell: ({ getValue }) => (
        <span className="font-medium">
          {getValue()}
        </span>
      ),
      size: 130,
    }),
    columnHelper.accessor('category', { header: translate('inquiryManagement.category'), cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>, size: 140 }),
    columnHelper.accessor('title', {
      header: translate('inquiryManagement.title'),
      cell: ({ row }) => (
        <div>
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {row.original.content}
          </div>
        </div>
      ),
      size: 360,
    }),
    columnHelper.accessor('status', { header: translate('inquiryManagement.status'), cell: ({ getValue }) => <InquiryStatusBadge status={getValue()} />, size: 110 }),
    columnHelper.accessor('assigneeName', {
      header: translate('inquiryManagement.assignee'),
      cell: ({ getValue }) => getValue()
        ? (
          <span className="text-xs font-medium text-foreground">
            {getValue()}
          </span>
        )
        : (
          <span className="text-xs text-muted-foreground">
            {translate('inquiryManagement.unassigned')}
          </span>
        ),
      size: 130,
    }),
    columnHelper.accessor('createdAt', {
      header: translate('inquiryManagement.createdAt'),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString(locale)}
        </span>
      ),
      size: 130,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('inquiryManagement.manage'),
      enableSorting: false,
      size: 90,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title={translate('inquiryManagement.reply')}
            aria-label={translate('inquiryManagement.reply')}
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
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title={translate('inquiryManagement.deleteInquiry')}
            aria-label={translate('inquiryManagement.deleteInquiry')}
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
        </div>
      ),
    }),
  ];
}
