import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getMessageTemplatesControllerGetMessageTemplatesQueryKey, useMessageTemplatesControllerDeleteMessageTemplate, useMessageTemplatesControllerGetMessageTemplates } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageChannel, MessageTemplateItemDto } from '#/.generated/api/model';
import { CardDescription, CardTitle } from '#/.generated/shadcn/components/ui';
import { PageSection } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { TemplateCreateDialog } from './-components/template-create-dialog';
import { TemplateSectionCard } from './-components/template-section-card';
import { TemplateUpdateDialog } from './-components/template-update-dialog';
import { createMessageTemplateColumns } from './-configs/message-template-columns.config';

export const Route = createFileRoute('/_protected/_app/message-management/')({
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

function MessageTemplatesPageComponent() {
  const { i18n, t } = useI18n();
  const queryClient = useQueryClient();
  const deleteMutation = useMessageTemplatesControllerDeleteMessageTemplate();

  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplateItemDto | null>(null);

  const handleDelete = useCallback(async (template: MessageTemplateItemDto) => {
    const ok = await confirm({
      title: t('templates.deleteConfirmTitle'),
      description: t('templates.deleteConfirmDescription', {
        name: template.name,
        code: template.code,
      }),
      confirmLabel: t('templates.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (ok) {
      try {
        await deleteMutation.mutateAsync({ id: template.id });
        await queryClient.invalidateQueries({
          queryKey: getMessageTemplatesControllerGetMessageTemplatesQueryKey(),
        });
        toast.success(t('templates.deleteSuccess'));
      }
      catch {
        toast.error(t('templates.deleteFailed'));
      }
    }
  }, [t, deleteMutation, queryClient]);

  const table = useDataGrid<MessageTemplateItemDto>({
    client: false,
    data: [],
    columns: [],
    enableColumnFilters: false,
    enablePinning: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: 'code', desc: false }],
    },
    getRowId: (row) => row.id,
  });

  const tableState = table.getState();
  const globalFilter = String(tableState.globalFilter ?? '');
  const { data } = useMessageTemplatesControllerGetMessageTemplates({
    page: tableState.pagination.pageIndex + 1,
    limit: tableState.pagination.pageSize,
    search: globalFilter || undefined,
    sort: tableState.sorting.map((item) => item.id),
    direction: tableState.sorting.map((item) => (item.desc ? 'desc' : 'asc')),
    channel: selectedChannel !== 'all' ? (selectedChannel as MessageChannel) : undefined,
  });

  const templates = useMemo(() => data?.items ?? [], [data?.items]);

  const channelFilters = [
    { key: 'all', label: '전체 채널', icon: null },
    { key: 'EMAIL', label: '✉️ 이메일', icon: Mail },
    { key: 'SLACK', label: '💬 슬랙', icon: MessageSquare },
    { key: 'IN_APP', label: '🔔 인앱 알림', icon: Bell },
  ];

  const columns = useMemo(
    () => createMessageTemplateColumns({
      i18n,
      onEdit: setEditingTemplate,
      onDelete: (template) => void handleDelete(template),
    }),
    [handleDelete, i18n],
  );

  table.setOptions((options) => ({
    ...options,
    data: templates,
    columns,
    rowCount: data?.totalCount ?? 0,
    pageCount: data?.totalPages ?? 1,
  }));

  return (
    <PageSection icon="mail" title={t('templates.pageTitle')} description={t('templates.pageDescription')}>
      <PageSection.Actions><TemplateCreateDialog /></PageSection.Actions>
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <TemplateSectionCard
          header={(
            <div className="flex flex-col gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  {t('templates.listTitle')}
                </CardTitle>
                <CardDescription className="text-xs">
                  총
                  {' '}
                  {data?.totalCount ?? 0}
                  개 템플릿 등록됨
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
                        table.setPageIndex(0);
                      }}
                      className={`
                        rounded-md text-xs font-medium transition-all
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
          )}
          toolbar={(
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('templates.searchPlaceholder')}
              onReset={() => {
                setSelectedChannel('all');
                table.setPageIndex(0);
                table.resetGlobalFilter();
                table.resetSorting();
              }}
            />
          )}
          table={(
            <DataGrid
              table={table}
              onRowClick={(row) => {
                setEditingTemplate(row.original);
              }}
            />
          )}
          pagination={<DataTablePagination table={table} />}
        />
      </PageSection.Content>
      <PageSection.Dialogs>
        {editingTemplate && (
          <TemplateUpdateDialog
            key={editingTemplate.id}
            template={editingTemplate}
          />
        )}
      </PageSection.Dialogs>
    </PageSection>
  );
}
