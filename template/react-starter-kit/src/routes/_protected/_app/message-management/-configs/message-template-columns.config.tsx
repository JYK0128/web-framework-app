import { useI18n } from '@pkg/shared/web';
import { createColumnHelper } from '@tanstack/react-table';
import { Mail, MessageSquare, Pencil, Sparkles, Trash2 } from 'lucide-react';

import type { MessageTemplateItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { messageChannelVariants } from '#/routes/_protected/_app/message-management/-configs/message-template.config';

const columnHelper = createColumnHelper<MessageTemplateItemDto>();

type MessageTemplateColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onEdit: (template: MessageTemplateItemDto) => void
  onDelete: (template: MessageTemplateItemDto) => void
};

export function createMessageTemplateColumns({ i18n, onEdit, onDelete }: MessageTemplateColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  return [
    columnHelper.accessor('channel', {
      header: translate('templates.table.channel'),
      cell: ({ getValue }) => {
        const channel = getValue();
        return (
          <Badge variant="outline" className={messageChannelVariants({ channel, className: 'font-normal' })}>
            {channel === 'EMAIL' && <Mail className="size-3" />}
            {channel === 'SLACK' && (
              <MessageSquare className="size-3" />
            )}
            {channel === 'IN_APP' && <Sparkles className="size-3" />}
            {channel}
          </Badge>
        );
      },
      size: 110,
    }),
    columnHelper.accessor('code', {
      header: translate('templates.table.code'),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {getValue()}
        </span>
      ),
      size: 200,
    }),
    columnHelper.accessor('name', {
      header: translate('templates.titleField'),
      cell: ({ row }) => (
        <div className="">
          <div className="truncate font-medium text-foreground">{row.original.name}</div>
          {row.original.description && (
            <div className="truncate text-xs text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
      size: 320,
    }),
    columnHelper.accessor('updatedAt', {
      header: translate('templates.table.updatedAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString(dateLocale, { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>,
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('templates.table.actions'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(row.original);
            }}
            title={translate('templates.edit')}
            aria-label={translate('templates.edit')}
          >
            <Pencil className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row.original);
            }}
            title={translate('templates.delete')}
            aria-label={translate('templates.delete')}
            className="
              text-muted-foreground
              hover:bg-destructive/10 hover:text-destructive
            "
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
      size: 100,
    }),
  ];
}
