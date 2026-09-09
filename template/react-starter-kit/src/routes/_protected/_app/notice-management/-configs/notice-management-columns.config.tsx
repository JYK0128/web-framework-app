import { createColumnHelper } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';

import { type NoticeItemDto, NoticePriority, type NoticeStatus } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

const columnHelper = createColumnHelper<NoticeItemDto>();

type NoticeStatusBadgeProps = {
  status: NoticeStatus
  labels: Record<NoticeStatus, string>
};

function NoticeStatusBadge({ status, labels }: NoticeStatusBadgeProps) {
  let variant: 'default' | 'outline' | 'secondary' = 'secondary';
  if (status === 'published') variant = 'default';
  else if (status === 'scheduled') variant = 'outline';

  return <Badge variant={variant}>{labels[status]}</Badge>;
}

type DateCellProps = { value: string | null, locale: string };

function DateCell({ value, locale }: DateCellProps) {
  return <span className="text-xs text-muted-foreground">{value ? new Date(value).toLocaleString(locale) : '-'}</span>;
}

type NoticeColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  canUpdate: boolean
  canDelete: boolean
  onEdit: (notice: NoticeItemDto) => void
  onDelete: (notice: NoticeItemDto) => void
};

export function createNoticeManagementColumns({ i18n, canUpdate, canDelete, onEdit, onDelete }: NoticeColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  return [
    columnHelper.accessor('title', {
      header: translate('noticeManagement.titleField'),
      cell: ({ row }) => (
        <div>
          <div className="truncate font-medium">{row.original.title}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.content}</div>
        </div>
      ),
      size: 320,
    }),
    columnHelper.accessor('status', {
      header: translate('noticeManagement.status'),
      enableSorting: true,
      enablePinning: true,
      cell: ({ getValue }) => (
        <NoticeStatusBadge
          status={getValue()}
          labels={{
            draft: translate('noticeManagement.draft'),
            scheduled: translate('noticeManagement.scheduled'),
            published: translate('noticeManagement.published'),
            expired: translate('noticeManagement.expired'),
          }}
        />
      ),
      size: 110,
    }),
    columnHelper.accessor('priority', {
      header: translate('noticeManagement.priorityField'),
      cell: ({ getValue }) => {
        const priority = getValue();
        if (priority === NoticePriority.HIGH) return <Badge variant="destructive">{translate('noticeManagement.priority.urgent')}</Badge>;
        if (priority === NoticePriority.NORMAL) return <Badge variant="outline">{translate('noticeManagement.priority.important')}</Badge>;
        return translate('noticeManagement.priority.normal');
      },
      size: 100,
    }),
    columnHelper.accessor('publishedAt', {
      header: translate('noticeManagement.publishedAt'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={dateLocale} />,
      size: 170,
    }),
    columnHelper.accessor('expiresAt', {
      header: translate('noticeManagement.expiresAtField'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={dateLocale} />,
      size: 170,
    }),
    columnHelper.accessor('createdAt', {
      header: translate('noticeManagement.createdAt'),
      cell: ({ getValue }) => <DateCell value={getValue()} locale={dateLocale} />,
      size: 170,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('noticeManagement.manage'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {canUpdate && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
              <span className="sr-only">{translate('noticeManagement.edit')}</span>
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)}>
              <Trash2 className="size-4 text-destructive" />
              <span className="sr-only">{translate('noticeManagement.delete')}</span>
            </Button>
          )}
        </div>
      ),
      size: 100,
    }),
  ];
}
