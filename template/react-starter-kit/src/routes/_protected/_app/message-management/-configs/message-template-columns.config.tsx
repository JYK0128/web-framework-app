import { createColumnHelper } from '@tanstack/react-table';
import { Mail, MessageCircle, MessageSquare, Pencil, Phone, Sparkles, Trash2 } from 'lucide-react';

import type { MessageChannel, MessageTemplateItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';
import { messageChannelVariants } from '#/routes/_protected/_app/message-management/-configs/message-template.config';

const columnHelper = createColumnHelper<MessageTemplateItemDto>();

type MessageTemplateColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  canUpdate?: boolean
  canDelete?: boolean
  onEdit: (template: MessageTemplateItemDto) => void
  onDelete: (template: MessageTemplateItemDto) => void
  catalogCodes?: Set<string>
};

function renderChannelIcon(channel: MessageChannel) {
  switch (channel) {
    case 'EMAIL':
      return <Mail className="size-3" />;
    case 'SLACK':
      return <MessageSquare className="size-3" />;
    case 'IN_APP':
      return <Sparkles className="size-3" />;
    case 'SMS':
      return <Phone className="size-3" />;
    case 'ALIMTALK':
      return <MessageCircle className="size-3" />;
    default:
      return null;
  }
}

export function createMessageTemplateColumns({
  i18n,
  canUpdate = true,
  canDelete = true,
  onEdit,
  onDelete,
  catalogCodes,
}: MessageTemplateColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  return [
    columnHelper.accessor('code', {
      header: translate('messageManagement.table.code'),
      cell: ({ getValue }) => {
        const code = getValue();
        const isSystem = catalogCodes?.has(code);
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-semibold text-foreground">
              {code}
            </span>
            {isSystem && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-semibold"
              >
                {translate('messageManagement.systemBadge')}
              </Badge>
            )}
          </div>
        );
      },
      size: 210,
    }),
    columnHelper.accessor('name', {
      header: translate('messageManagement.nameField'),
      cell: ({ row }) => (
        <div>
          <div className="truncate font-medium text-foreground">{row.original.name}</div>
          {row.original.description && (
            <div className="truncate text-xs text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
      size: 260,
    }),
    columnHelper.accessor('channels', {
      id: 'channels',
      header: translate('messageManagement.table.channel'),
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterOptions: [
          { label: '이메일', value: 'EMAIL' },
          { label: '슬랙', value: 'SLACK' },
          { label: '인앱 알림', value: 'IN_APP' },
          { label: 'SMS', value: 'SMS' },
          { label: '알림톡', value: 'ALIMTALK' },
        ],
      },
      filterFn: (row, id, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        const channels = row.getValue<MessageTemplateItemDto['channels']>(id) ?? [];
        const selected = Array.isArray(value) ? value : [value];
        return channels.some((ch) => selected.includes(ch.channel));
      },
      cell: ({ getValue }) => {
        const channels = getValue() ?? [];
        if (channels.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {channels.map((ch) => {
              const channelKey = (ch.channel ?? 'IN_APP');
              return (
                <Badge
                  key={ch.id || ch.channel}
                  variant="outline"
                  className={messageChannelVariants({
                    channel: channelKey,
                    className: !ch.isActive ? 'opacity-40 grayscale line-through' : '',
                  })}
                  title={!ch.isActive ? translate('messageManagement.channelInactiveTooltip', '비활성화된 채널') : undefined}
                >
                  {renderChannelIcon(channelKey)}
                  <span>{channelKey}</span>
                </Badge>
              );
            })}
          </div>
        );
      },
      size: 240,
    }),
    columnHelper.accessor('variables', {
      header: translate('messageManagement.variablesTitle', '지원 키워드'),
      cell: ({ getValue }) => {
        const vars = getValue() ?? [];
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {vars.length > 0 ? `${vars.length}개 키워드` : '-'}
          </span>
        );
      },
      size: 100,
    }),
    columnHelper.accessor('updatedAt', {
      header: translate('messageManagement.table.updatedAt'),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString(dateLocale, { year: 'numeric', month: '2-digit', day: '2-digit' })}
        </span>
      ),
      size: 110,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('messageManagement.manage'),
      enableSorting: false,
      cell: ({ row }) => {
        const isSystem = catalogCodes?.has(row.original.code);
        return (
          <div className="flex justify-end gap-1">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(row.original);
                }}
                title={translate('messageManagement.edit')}
                aria-label={translate('messageManagement.edit')}
              >
                <Pencil className="
                  size-4 text-muted-foreground
                  hover:text-foreground
                "
                />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                disabled={isSystem}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isSystem) {
                    onDelete(row.original);
                  }
                }}
                title={isSystem ? translate('messageManagement.systemTemplateDesc') : translate('messageManagement.delete')}
                aria-label={translate('messageManagement.delete')}
                className="
                  text-muted-foreground
                  hover:bg-destructive/10 hover:text-destructive
                  disabled:opacity-30
                  disabled:hover:bg-transparent
                "
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        );
      },
      size: 90,
    }),
  ];
}
