import { valueIf, when } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getTermsControllerGetAdminTermGroupsQueryKey, getTermsControllerGetAdminTermsQueryKey, useTermsControllerDeleteTerm, useTermsControllerDeleteTermGroup, useTermsControllerGetAdminTermGroups, useTermsControllerGetAdminTerms, useTermsControllerPublishTerm } from '#/.generated/api/endpoints/terms/terms';
import type { AdminTermDto, TermsControllerGetAdminTermsParams } from '#/.generated/api/model';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { openDialog, PageSection, SectionCard } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { TermCreateDialog } from './-components/term-create-dialog';
import { TermGroupCreateDialog } from './-components/term-group-create-dialog';
import { TermGroupUpdateDialog } from './-components/term-group-update-dialog';
import { TermUpdateDialog } from './-components/term-update-dialog';
import { TermViewDialog } from './-components/term-view-dialog';
import { createTermColumns } from './-configs/term-columns.config';

export const Route = createFileRoute('/_protected/_app/terms-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'term:manage')) throw notFound({ routeId: Route.id });
  },
  component: TermsPageComponent,
});

function TermsPageComponent() {
  const { i18n, t } = useI18n();
  const { user } = Route.useRouteContext();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const queryClient = useQueryClient();
  const deleteMutation = useTermsControllerDeleteTerm();
  const publishMutation = useTermsControllerPublishTerm();
  const deleteGroupMutation = useTermsControllerDeleteTermGroup();

  const canUpdate = hasPermission(user.permissions, 'term:update');
  const canDelete = hasPermission(user.permissions, 'term:delete');

  const openView = useCallback((term: AdminTermDto) => {
    void openDialog(TermViewDialog, { term }, { dialogId: `term-view-${term.id}` });
  }, []);

  const openEdit = useCallback((term: AdminTermDto) => {
    void openDialog(TermUpdateDialog, { term }, { dialogId: `term-edit-${term.id}` });
  }, []);

  const handlePublish = useCallback(async (term: AdminTermDto) => {
    if (term.isPublished) return;
    await publishMutation.mutateAsync({ id: term.id });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsQueryKey() });
  }, [publishMutation, queryClient]);
  const handleDelete = useCallback(async (term: AdminTermDto) => {
    if (!await confirm({ description: t('terms.deleteConfirm'), tone: 'danger' })) return;
    await deleteMutation.mutateAsync({ id: term.id });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsQueryKey() });
  }, [deleteMutation, queryClient, t]);

  const columns = useMemo(
    () => createTermColumns({
      i18n,
      canUpdate,
      canDelete,
      onView: openView,
      onEdit: openEdit,
      onPublish: (term) => void handlePublish(term),
      onDelete: (term) => void handleDelete(term),
    }),
    [canDelete, canUpdate, handleDelete, handlePublish, i18n, openEdit, openView],
  );

  const table = useDataGrid({
    client: false,
    data: [],
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: 'createdAt', desc: true }],
    },
  });
  const groupsQuery = useTermsControllerGetAdminTermGroups();
  const groups = groupsQuery.data?.groups ?? [];
  const activeGroupId = groups.some((group) => group.id === selectedGroupId) ? selectedGroupId : groups[0]?.id ?? '';
  const selectedGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const handleDeleteGroup = useCallback(async () => {
    if (!selectedGroup) return;
    if (!await confirm({ description: t('terms.groupDeleteConfirm'), tone: 'danger' })) return;
    await deleteGroupMutation.mutateAsync({ id: selectedGroup.id });
    setSelectedGroupId('');
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermGroupsQueryKey() });
  }, [deleteGroupMutation, queryClient, selectedGroup, t]);
  const queryParams = useMemo<TermsControllerGetAdminTermsParams>(() => {
    const state = table.getState();
    return {
      page: state.pagination.pageIndex + 1,
      limit: state.pagination.pageSize,
      groupId: activeGroupId || undefined,
      search: when((value): value is string => typeof value === 'string', (search) => search || undefined)(state.globalFilter),
      sort: state.sorting.map(({ id }) => id),
      direction: state.sorting.map(({ desc }) => desc ? 'desc' : 'asc'),
    };
  }, [activeGroupId, table]);
  const termsQuery = useTermsControllerGetAdminTerms(
    valueIf(Boolean(activeGroupId), queryParams),
    { query: { enabled: Boolean(activeGroupId) } },
  );

  const terms = useMemo(() => termsQuery.data?.items ?? [], [termsQuery.data?.items]);
  const totalCount = termsQuery.data?.totalCount ?? 0;
  const totalPages = termsQuery.data?.totalPages ?? 1;
  const canCreate = hasPermission(user.permissions, 'term:create');

  table.setOptions((options) => ({ ...options, data: terms, pageCount: totalPages, rowCount: totalCount }));

  return (
    <PageSection
      icon="file-text"
      title={t('terms.title')}
      description={t('terms.description')}
    >
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-6 p-2
      "
      >
        <SectionCard
          textSize="base"
          title={t('terms.groupsTitle')}
          description={t('terms.groupsDescription')}
          actions={valueIf(canCreate, [
            {
              label: t('terms.newGroup') || '새 그룹 생성',
              icon: 'plus',
              onClick: async () => {
                const id = await openDialog(TermGroupCreateDialog, undefined, { dialogId: 'term-group-create' });
                if (id) setSelectedGroupId(id);
              },
            },
          ])}
        >
          <SectionCard.Content>
            <div className="flex items-center justify-between gap-4">
              {groups.length > 0
                ? (
                  <Select
                    items={groups.map((g) => ({ label: `${g.title} (${g.code})`, value: g.id }))}
                    value={activeGroupId}
                    onValueChange={(value) => {
                      setSelectedGroupId(value ?? '');
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder={t('terms.groupSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.title}
                          {' ('}
                          {group.code}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
                : (
                  <p className="text-sm text-muted-foreground">{t('terms.noGroups')}</p>
                )}
              <div className="flex shrink-0 items-center gap-2">
                {selectedGroup && canUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void openDialog(TermGroupUpdateDialog, { group: selectedGroup }, { dialogId: `term-group-edit-${selectedGroup.id}` }).then((id) => {
                        if (id) setSelectedGroupId(id);
                      });
                    }}
                  >
                    {t('terms.editGroup')}
                  </Button>
                )}
                {selectedGroup && canDelete && (
                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteGroup()}>
                    <Trash2 className="size-4 text-destructive" />
                    {t('terms.deleteGroup')}
                  </Button>
                )}
              </div>
            </div>
          </SectionCard.Content>
        </SectionCard>

        <SectionCard
          textSize="sm"
          title={t('terms.listTitle')}
          description={selectedGroup ? t('terms.listDescription') : t('terms.selectGroupHint')}
          actions={valueIf(Boolean(activeGroupId && canCreate), [
            {
              label: t('terms.create'),
              icon: 'plus',
              onClick: () => {
                void openDialog(TermCreateDialog, { termGroupId: activeGroupId }, { dialogId: `term-create-${activeGroupId}` }).then((created) => {
                  if (created) {
                    void queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsQueryKey() });
                  }
                });
              },
            },
          ])}
        >
          <SectionCard.Content className="grid h-full grid-rows-[auto_1fr_auto]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('terms.searchPlaceholder')}
              onReset={() => {
                table.setPageIndex(0);
                table.resetGlobalFilter();
                table.resetSorting();
              }}
            />
            <div className="flex-1">
              <DataGrid table={table} onRowClick={(row) => openView(row.original)} />
            </div>
            <DataTablePagination table={table} rowCount={totalCount} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
