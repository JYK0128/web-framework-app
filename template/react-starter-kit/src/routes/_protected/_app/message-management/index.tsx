import { valueIf, when } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getMessageTemplatesControllerGetMessageTemplatesQueryKey, useMessageTemplatesControllerDeleteMessageTemplate, useMessageTemplatesControllerGetMessageTemplateCatalog, useMessageTemplatesControllerGetMessageTemplates } from '#/.generated/api/endpoints/message-templates/message-templates';
import type { MessageChannel, MessageTemplateItemDto, MessageTemplatesControllerGetMessageTemplatesParams } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { openDialog } from '#/components/dialog';
import { PageSection, SectionCard } from '#/components/layout';
import { DATA_GRID_PAGE_SIZE } from '#/configs/list.config';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { TemplateCreateDialog } from './-components/template-create-dialog';
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
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const canCreate = hasPermission(user.permissions, 'template:manage') || hasPermission(user.permissions, 'template:create');
  const canUpdate = hasPermission(user.permissions, 'template:manage') || hasPermission(user.permissions, 'template:update');
  const canDelete = hasPermission(user.permissions, 'template:manage') || hasPermission(user.permissions, 'template:delete');

  const deleteMutation = useMessageTemplatesControllerDeleteMessageTemplate();
  const { data: catalogData } = useMessageTemplatesControllerGetMessageTemplateCatalog();

  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  const catalogCodes = useMemo(
    () => new Set(catalogData?.items.map((item) => item.code) ?? []),
    [catalogData?.items],
  );

  const handleEditTemplate = useCallback((template: MessageTemplateItemDto) => {
    void openDialog(TemplateUpdateDialog, { template }, { dialogId: `template-edit-${template.id}` });
  }, []);

  const handleDelete = useCallback(async (template: MessageTemplateItemDto) => {
    const ok = await confirm({
      title: t('messageManagement.deleteConfirmTitle'),
      description: t('messageManagement.deleteConfirmDescription', {
        name: template.name,
        code: template.code,
      }),
      confirmLabel: t('messageManagement.delete'),
      cancelLabel: t('app.dialog.cancel'),
      tone: 'danger',
    });

    if (ok) {
      try {
        await deleteMutation.mutateAsync({ id: template.id });
        await queryClient.invalidateQueries({
          queryKey: getMessageTemplatesControllerGetMessageTemplatesQueryKey(),
        });
      }
      catch {
        // Handled globally by MutationCache
      }
    }
  }, [deleteMutation, queryClient, t]);

  const columns = useMemo(
    () => createMessageTemplateColumns({
      i18n,
      canUpdate,
      canDelete,
      onEdit: handleEditTemplate,
      onDelete: (template) => void handleDelete(template),
      catalogCodes,
    }),
    [canDelete, canUpdate, catalogCodes, handleDelete, handleEditTemplate, i18n],
  );

  const table = useDataGrid<MessageTemplateItemDto>({
    client: false,
    data: [],
    columns,
    enableColumnFilters: false,
    enablePinning: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: DATA_GRID_PAGE_SIZE },
      sorting: [{ id: 'code', desc: false }],
    },
    getRowId: (row) => row.id,
  });

  const queryParams = useMemo<MessageTemplatesControllerGetMessageTemplatesParams>(() => {
    const state = table.getState();
    const sorting = state.sorting.filter(({ id }) => id !== 'actions');
    return {
      page: state.pagination.pageIndex + 1,
      limit: state.pagination.pageSize,
      search: when((value): value is string => typeof value === 'string', (search) => search || undefined)(state.globalFilter),
      sort: (sorting.length > 0 ? sorting : [{ id: 'code', desc: false }]).map(({ id }) => id),
      direction: (sorting.length > 0 ? sorting : [{ id: 'code', desc: false }]).map(({ desc }) => desc ? 'desc' : 'asc'),
      channel: valueIf(selectedChannel !== 'all', selectedChannel as MessageChannel),
    };
  }, [selectedChannel, table]);

  const { data } = useMessageTemplatesControllerGetMessageTemplates(queryParams);

  const templates = useMemo(() => data?.items ?? [], [data?.items]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  table.setOptions((options) => ({
    ...options,
    data: templates,
    rowCount: totalCount,
    pageCount: totalPages,
    defaultColumn: { size: 140 },
  }));

  const channelFilters = [
    { key: 'all', label: '전체 채널', icon: null },
    { key: 'EMAIL', label: '✉️ 이메일', icon: Mail },
    { key: 'SLACK', label: '💬 슬랙', icon: MessageSquare },
    { key: 'IN_APP', label: '🔔 인앱 알림', icon: Bell },
    { key: 'SMS', label: '📱 SMS', icon: null },
    { key: 'ALIMTALK', label: '💬 알림톡', icon: null },
  ];

  const handleCreateTemplate = useCallback(async () => {
    const isCreated = await openDialog(TemplateCreateDialog, undefined, { dialogId: 'template-create' });
    if (isCreated) {
      void queryClient.invalidateQueries({
        queryKey: getMessageTemplatesControllerGetMessageTemplatesQueryKey(),
      });
    }
  }, [queryClient]);

  return (
    <PageSection
      icon="mail"
      title={t('messageManagement.pageTitle')}
      description={t('messageManagement.pageDescription')}
    >
      {canCreate && (
        <PageSection.Actions>
          <Button type="button" onClick={() => void handleCreateTemplate()}>
            {t('messageManagement.create')}
          </Button>
        </PageSection.Actions>
      )}
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <SectionCard
          textSize="base"
          title={t('messageManagement.listTitle')}
          description={`총 ${totalCount}개 템플릿 등록됨`}
        >
          <SectionCard.Content className="
            grid h-full grid-rows-[auto_auto_1fr_auto]
          "
          >
            {/* 1. 채널 필터 탭 바 (표준 상단 행) */}
            <div className="flex items-center gap-1.5 border-b px-4 py-3">
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
                        rounded-md px-2.5 py-1 text-xs font-medium
                        transition-all cursor-pointer
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

            {/* 2. 툴바 */}
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('messageManagement.searchPlaceholder')}
              onReset={() => {
                setSelectedChannel('all');
                table.setPageIndex(0);
                table.resetGlobalFilter();
                table.resetSorting();
              }}
            />

            {/* 3. 테이블 */}
            <DataGrid
              table={table}
              onRowClick={(row) => {
                handleEditTemplate(row.original);
              }}
            />

            {/* 4. 페이지네이션 */}
            <DataTablePagination table={table} rowCount={totalCount} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
