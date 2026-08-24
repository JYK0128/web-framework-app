import { useI18n } from '@pkg/shared/web';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type SortingState } from '@tanstack/react-table';
import { Bell, Eye, EyeOff, Globe, Mail, MailCheck, MessageSquare, Pencil, Send, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useMessageTemplatesControllerGetMessageTemplates } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageChannel, MessageTemplateItemDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';

import { TemplateEditorDialog } from './-components/TemplateEditorDialog';
import { TemplateTestSendDialog } from './-components/TemplateTestSendDialog';

export const Route = createFileRoute('/_protected/_app/message-templates/')({
  beforeLoad: ({ context }) => {
    if (
      !hasPermission(context.user.permissions, 'template:manage')
      && !hasPermission(context.user.permissions, 'template:read')
    ) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: MessageTemplatesPageComponent,
});

function getChannelBadgeClass(channel: string): string {
  if (channel === 'EMAIL') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  if (channel === 'SLACK') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
}

const columnHelper = createColumnHelper<MessageTemplateItemDto>();

function MessageTemplatesPageComponent() {
  const { language, t } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplateItemDto | null>(null);
  const [testSendOpen, setTestSendOpen] = useState(false);
  const [testSendingTemplate, setTestSendingTemplate] = useState<MessageTemplateItemDto | null>(null);

  const { data } = useMessageTemplatesControllerGetMessageTemplates({
    channel: selectedChannel !== 'all' ? (selectedChannel as MessageChannel) : undefined,
    search: globalFilter || undefined,
  });

  const allTemplates = useMemo(() => data?.items ?? [], [data?.items]);

  // Group templates by unique code to show one row per template definition
  const uniqueCodeTemplates = useMemo(() => {
    const map = new Map<string, MessageTemplateItemDto>();
    for (const item of allTemplates) {
      const existing = map.get(item.code);
      if (!existing || item.locale === 'ko') {
        map.set(item.code, item);
      }
    }
    return Array.from(map.values());
  }, [allTemplates]);

  const totalCount = uniqueCodeTemplates.length;

  const channelFilters = [
    { key: 'all', label: '전체 채널', icon: null },
    { key: 'EMAIL', label: '✉️ 이메일', icon: Mail },
    { key: 'SLACK', label: '💬 슬랙', icon: MessageSquare },
    { key: 'IN_APP', label: '🔔 인앱 알림', icon: Bell },
  ];

  const columns = useMemo(() => [
    columnHelper.accessor('channel', {
      header: t('templates.table.channel'),
      cell: ({ getValue }) => {
        const ch = getValue();
        return (
          <Badge
            variant="secondary"
            className={`
              gap-1 font-normal text-xs
              ${getChannelBadgeClass(ch)}
            `}
          >
            {ch === 'EMAIL' && <Mail className="size-3" />}
            {ch === 'SLACK' && <MessageSquare className="size-3" />}
            {ch === 'IN_APP' && <Sparkles className="size-3" />}
            {ch}
          </Badge>
        );
      },
      size: 110,
    }),
    columnHelper.accessor('code', {
      header: t('templates.table.code'),
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {getValue()}
        </span>
      ),
      size: 200,
    }),
    columnHelper.accessor('name', {
      header: t('templates.titleField'),
      cell: ({ row }) => (
        <div className="min-w-0 py-0.5">
          <div className="font-medium text-foreground truncate">
            {row.original.name}
          </div>
          {row.original.description && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
      size: 320,
    }),
    columnHelper.display({
      id: 'languages',
      header: t('templates.table.supportedLocales'),
      cell: ({ row }) => {
        const supported = allTemplates
          .filter((t) => t.code === row.original.code)
          .map((t) => t.locale.toUpperCase());

        return (
          <div className="flex items-center gap-1">
            {supported.map((loc) => (
              <Badge
                key={loc}
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0"
              >
                <Globe className="size-2.5 mr-0.5 opacity-70" />
                {loc}
              </Badge>
            ))}
          </div>
        );
      },
      size: 130,
    }),
    columnHelper.accessor('isActive', {
      header: '발송 상태',
      cell: ({ getValue }) => {
        const active = getValue();
        return active
          ? (
            <Badge className="
              border-emerald-500/30 bg-emerald-500/10 text-emerald-600 gap-1
              font-normal
              dark:text-emerald-400
            "
            >
              <Eye className="size-3" />
              활성
            </Badge>
          )
          : (
            <Badge
              variant="outline"
              className="text-muted-foreground gap-1 font-normal"
            >
              <EyeOff className="size-3" />
              비활성
            </Badge>
          );
      },
      size: 100,
    }),
    columnHelper.accessor('updatedAt', {
      header: t('templates.table.updatedAt'),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString(dateLocale)}
        </span>
      ),
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: t('templates.table.actions'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setTestSendingTemplate(row.original);
              setTestSendOpen(true);
            }}
            title={t('templates.testSend')}
            aria-label={t('templates.testSend')}
          >
            <Send className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTemplate(row.original);
              setEditorOpen(true);
            }}
            title={t('templates.edit')}
            aria-label={t('templates.edit')}
          >
            <Pencil className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
        </div>
      ),
      size: 90,
    }),
  ], [allTemplates, dateLocale, t]);

  const table = useDataGrid({
    client: true,
    data: uniqueCodeTemplates,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    initialState: {
      pagination: { pageIndex: page - 1, pageSize },
      sorting,
    },
    onPaginationChange: (nextPagination: PaginationState) => {
      setPage(nextPagination.pageIndex + 1);
      setPageSize(nextPagination.pageSize);
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: (row) => row.id,
  });

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      {/* Header Section */}
      <div className="
        flex flex-col gap-4
        sm:flex-row sm:items-center sm:justify-between
      "
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="
              flex size-9 items-center justify-center rounded-lg bg-primary/10
              text-primary shadow-xs
            "
            >
              <MailCheck className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('templates.pageTitle')}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('templates.pageDescription')}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="
        grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden shadow-xs
      "
      >
        <CardHeader className="shrink-0 border-b pb-3">
          <div className="
            flex flex-col gap-3
            sm:flex-row sm:items-center sm:justify-between
          "
          >
            <div>
              <CardTitle className="text-base font-semibold">
                {t('templates.listTitle')}
              </CardTitle>
              <CardDescription className="text-xs">
                총
                {' '}
                {totalCount}
                개 템플릿 등록됨 · 한국어/영어 다국어 지원
              </CardDescription>
            </div>

            {/* Channel Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {channelFilters.map((cat) => {
                const isActive = selectedChannel === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setSelectedChannel(cat.key);
                      setPage(1);
                    }}
                    className={`
                      rounded-md px-2.5 py-1 text-xs font-medium transition-all
                      ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : `
                      bg-muted/70 text-muted-foreground
                      hover:bg-muted hover:text-foreground
                    `
                  }
                    `}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="
          grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden p-0
        "
        >
          <DataGridToolbar
            table={table}
            searchPlaceholder={t('templates.searchPlaceholder')}
            onReset={() => {
              setGlobalFilter('');
              setSelectedChannel('all');
              setPage(1);
            }}
          />
          <div className="min-h-0 flex-1">
            <DataGrid
              table={table}
              onRowClick={(row) => {
                setEditingTemplate(row.original);
                setEditorOpen(true);
              }}
            />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <TemplateEditorDialog
        open={editorOpen}
        template={editingTemplate}
        allTemplates={allTemplates}
        onOpenChange={setEditorOpen}
      />

      {/* Test Send Dialog */}
      <TemplateTestSendDialog
        open={testSendOpen}
        template={testSendingTemplate}
        onOpenChange={setTestSendOpen}
      />
    </div>
  );
}
