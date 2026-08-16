import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createColumnHelper, type PaginationState, type SortingState, type Updater } from '@tanstack/react-table';
import { Eye, FileText, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getTermsControllerGetAdminTermGroupsQueryKey, getTermsControllerGetAdminTermsQueryKey, useTermsControllerCreateTerm, useTermsControllerCreateTermGroup, useTermsControllerDeleteTerm, useTermsControllerDeleteTermGroup, useTermsControllerGetAdminTermGroups, useTermsControllerGetAdminTerms, useTermsControllerPublishTerm, useTermsControllerUpdateTerm, useTermsControllerUpdateTermGroup } from '#/.generated/api/endpoints/terms/terms';
import type { AdminTermDto, CreateTermGroupRequestDto, CreateTermRequestDto, TermGroupItemDto, TermsControllerGetAdminTermsDirectionItem, TermsControllerGetAdminTermsParams, TermsControllerGetAdminTermsSortItem, UpdateTermGroupRequestDto, UpdateTermRequestDto } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { hasPermission } from '#/core/auth/permissions';

import { TermEditorDialog } from './-components/TermEditorDialog';
import { TermGroupEditorDialog } from './-components/TermGroupEditorDialog';
import { TermViewDialog } from './-components/TermViewDialog';

export const Route = createFileRoute('/_protected/terms/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'term:read')) throw notFound({ routeId: Route.id });
  },
  component: TermsPageComponent,
});

const columnHelper = createColumnHelper<AdminTermDto>();

function TermsPageComponent() {
  const { language, t } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [groupEditorOpen, setGroupEditorOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [editingGroup, setEditingGroup] = useState<TermGroupItemDto | null>(null);
  const [editingTerm, setEditingTerm] = useState<AdminTermDto | null>(null);
  const [viewingTerm, setViewingTerm] = useState<AdminTermDto | null>(null);
  const [activeFilters, setActiveFilters] = useState<{
    limit: number
    search?: string
    sort: TermsControllerGetAdminTermsSortItem[]
    direction: TermsControllerGetAdminTermsDirectionItem[]
  }>({
    limit: 10,
    search: undefined,
    sort: ['createdAt'],
    direction: ['desc'],
  });
  const groupsQuery = useTermsControllerGetAdminTermGroups();
  const groups = groupsQuery.data?.groups ?? [];
  const activeGroupId = groups.some((group) => group.id === selectedGroupId) ? selectedGroupId : groups[0]?.id ?? '';
  const selectedGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const queryParams = useMemo<TermsControllerGetAdminTermsParams>(() => ({
    page,
    limit: activeFilters.limit,
    groupId: activeGroupId || undefined,
    search: activeFilters.search,
    sort: activeFilters.sort,
    direction: activeFilters.direction,
  }), [activeGroupId, activeFilters, page]);
  const termsQuery = useTermsControllerGetAdminTerms(
    activeGroupId ? queryParams : undefined,
    { query: { enabled: Boolean(activeGroupId) } },
  );

  const createMutation = useTermsControllerCreateTerm();
  const createGroupMutation = useTermsControllerCreateTermGroup();
  const updateMutation = useTermsControllerUpdateTerm();
  const updateGroupMutation = useTermsControllerUpdateTermGroup();
  const deleteMutation = useTermsControllerDeleteTerm();
  const deleteGroupMutation = useTermsControllerDeleteTermGroup();
  const publishMutation = useTermsControllerPublishTerm();
  const terms = useMemo(() => termsQuery.data?.items ?? [], [termsQuery.data?.items]);
  const totalCount = termsQuery.data?.totalCount ?? 0;
  const totalPages = termsQuery.data?.totalPages ?? 1;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isGroupSaving = createGroupMutation.isPending || updateGroupMutation.isPending;
  const canCreate = hasPermission(user.permissions, 'term:create');
  const canUpdate = hasPermission(user.permissions, 'term:update');
  const canDelete = hasPermission(user.permissions, 'term:delete');

  const invalidateGroups = useCallback(() => queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermGroupsQueryKey() }), [queryClient]);
  const invalidateTerms = useCallback(() => queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsQueryKey() }), [queryClient]);

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupEditorOpen(true);
  };

  const openEditGroup = () => {
    if (!selectedGroup) return;
    setEditingGroup(selectedGroup);
    setGroupEditorOpen(true);
  };

  const openCreate = () => {
    if (!activeGroupId) return;
    setEditingTerm(null);
    setEditorOpen(true);
  };

  const openEdit = useCallback((term: AdminTermDto) => {
    setEditingTerm(term);
    setEditorOpen(true);
  }, []);

  const openView = useCallback((term: AdminTermDto) => {
    setViewingTerm(term);
  }, []);

  const handleSaveGroup = async (input: CreateTermGroupRequestDto | UpdateTermGroupRequestDto) => {
    try {
      if (editingGroup) {
        await updateGroupMutation.mutateAsync({ id: editingGroup.id, data: input });
      }
      else {
        const result = await createGroupMutation.mutateAsync({ data: input as CreateTermGroupRequestDto });
        setSelectedGroupId(result.id);
      }
      await invalidateGroups();
      setGroupEditorOpen(false);
      toast.success(t('terms.groupSaveSuccess'));
    }
    catch {
      return;
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    const isConfirmed = await confirm({
      description: t('terms.groupDeleteConfirm'),
      tone: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteGroupMutation.mutateAsync({ id: selectedGroup.id });
    }
    catch {
      return;
    }

    setSelectedGroupId('');
    await invalidateGroups();
    toast.success(t('terms.groupDeleteSuccess'));
  };

  const handleSave = async (input: CreateTermRequestDto | UpdateTermRequestDto) => {
    try {
      if (editingTerm) await updateMutation.mutateAsync({ id: editingTerm.id, data: input });
      else await createMutation.mutateAsync({ data: input as CreateTermRequestDto });
      await invalidateTerms();
      setEditorOpen(false);
      toast.success(t('terms.saveSuccess'));
    }
    catch {
      return;
    }
  };

  const handlePublish = useCallback(async (term: AdminTermDto) => {
    if (term.isPublished) return;

    try {
      await publishMutation.mutateAsync({ id: term.id });
      await invalidateTerms();
      toast.success(t('terms.publishSuccess'));
    }
    catch {
      return;
    }
  }, [invalidateTerms, publishMutation, t]);

  const handleDelete = useCallback(async (term: AdminTermDto) => {
    const isConfirmed = await confirm({
      description: t('terms.deleteConfirm'),
      tone: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteMutation.mutateAsync({ id: term.id });
      await invalidateTerms();
      toast.success(t('terms.deleteSuccess'));
    }
    catch {
      return;
    }
  }, [deleteMutation, invalidateTerms, t]);

  const handleRefreshGroups = () => {
    void groupsQuery.refetch();
  };

  const handleRefreshTerms = () => {
    void termsQuery.refetch();
  };

  const handleGlobalFilterChange = (value: string) => {
    setPage(1);
    setActiveFilters((prev) => ({
      ...prev,
      search: value.trim() || undefined,
    }));
  };

  const handleSortingChange = (sorting: SortingState) => {
    const nextSorting = sorting.filter(({ id }) => id !== 'actions');
    setPage(1);
    setActiveFilters((prev) => ({
      ...prev,
      sort: nextSorting.length > 0
        ? nextSorting.map(({ id }) => id as TermsControllerGetAdminTermsSortItem)
        : ['createdAt'],
      direction: nextSorting.length > 0
        ? nextSorting.map(({ desc }) => desc ? 'desc' : 'asc')
        : ['desc'],
    }));
  };

  const columns = useMemo(() => [
    columnHelper.accessor('version', {
      id: 'version',
      header: t('terms.version'),
    }),
    columnHelper.accessor('isPublished', {
      id: 'status',
      header: t('terms.status'),
      enableSorting: false,
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? 'default' : 'secondary'}>
          {getValue() ? t('terms.published') : t('terms.draft')}
        </Badge>
      ),
    }),
    columnHelper.accessor('publishedAt', {
      id: 'publishedAt',
      header: t('terms.publishedAt'),
      cell: ({ getValue }) => {
        const publishedAt = getValue();
        return <span className="text-xs text-muted-foreground">{publishedAt ? new Date(publishedAt).toLocaleString(dateLocale) : '-'}</span>;
      },
    }),
    columnHelper.accessor('createdAt', {
      id: 'createdAt',
      header: t('terms.createdAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleString(dateLocale)}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">{t('terms.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const term = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => openView(term)} title={t('terms.view')} aria-label={t('terms.view')}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            {canUpdate && !term.isPublished && (
              <>
                <Button variant="ghost" size="sm" onClick={() => openEdit(term)}>
                  <Pencil className="size-4" />
                  <span className="sr-only">{t('terms.edit')}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => void handlePublish(term)}>
                  {t('terms.publish')}
                </Button>
              </>
            )}
            {canDelete && !term.isPublished && (
              <Button variant="ghost" size="icon" onClick={() => void handleDelete(term)}>
                <Trash2 className="size-4 text-destructive" />
                <span className="sr-only">{t('terms.delete')}</span>
              </Button>
            )}
          </div>
        );
      },
    }),
  ], [canDelete, canUpdate, dateLocale, handleDelete, handlePublish, openEdit, openView, t]);

  const table = useDataGrid({
    client: false,
    data: terms,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
    },
    pageCount: totalPages,
    rowCount: totalCount,
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const nextState = typeof updater === 'function' ? updater({ pageIndex: page - 1, pageSize: activeFilters.limit }) : updater;
      setPage(nextState.pageIndex + 1);
      if (nextState.pageSize !== activeFilters.limit) {
        setActiveFilters((prev) => ({ ...prev, limit: nextState.pageSize }));
      }
    },
    onGlobalFilterChange: handleGlobalFilterChange,
    onSortingChange: handleSortingChange,
  });

  useEffect(() => {
    table.setPageIndex(page - 1);
    table.setPageSize(activeFilters.limit);
  }, [activeFilters.limit, page, table]);

  return (
    <div className="
      mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_1fr] gap-6
      overflow-hidden p-6
    "
    >
      <div className="
        grid gap-4
        sm:flex sm:items-center sm:justify-between
      "
      >
        <div>
          <h1 className="
            flex items-center gap-2 text-2xl font-bold tracking-tight
          "
          >
            <FileText className="size-6 text-primary" />
            {t('terms.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('terms.description')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">{t('terms.groupsTitle')}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleRefreshGroups} disabled={groupsQuery.isFetching} title={t('terms.refresh')} aria-label={t('terms.refresh')}>
                <RefreshCw className={`
                  size-4
                  ${groupsQuery.isFetching ? 'animate-spin' : ''}
                `}
                />
              </Button>
              {canCreate && (
                <Button variant="outline" size="sm" onClick={openCreateGroup}>
                  <Plus className="size-4" />
                  {t('terms.newGroup')}
                </Button>
              )}
            </div>
          </div>
          <CardDescription>{t('terms.groupsDescription')}</CardDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {groups.length > 0
              ? (
                <Select
                  value={activeGroupId}
                  onValueChange={(value) => {
                    setSelectedGroupId(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder={t('terms.groupSelect')}>
                      {selectedGroup ? `${selectedGroup.title} (${selectedGroup.code})` : t('terms.groupSelect')}
                    </SelectValue>
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
            {selectedGroup && canUpdate && (
              <Button variant="ghost" size="sm" onClick={openEditGroup}>
                <Pencil className="size-4" />
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
        </CardHeader>
      </Card>

      <Card className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">{t('terms.listTitle')}</CardTitle>
            {activeGroupId && (
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleRefreshTerms} disabled={termsQuery.isFetching} title={t('terms.refresh')} aria-label={t('terms.refresh')}>
                  <RefreshCw className={`
                    size-4
                    ${termsQuery.isFetching ? 'animate-spin' : ''}
                  `}
                  />
                </Button>
                {canCreate && (
                  <Button variant="outline" size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    {t('terms.create')}
                  </Button>
                )}
              </div>
            )}
          </div>
          <CardDescription>{selectedGroup ? t('terms.listDescription') : t('terms.selectGroupHint')}</CardDescription>
        </CardHeader>
        <CardContent className="
          grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden p-0
        "
        >
          <DataGridToolbar
            table={table}
            searchPlaceholder={t('terms.searchPlaceholder')}
            onReset={() => {
              setPage(1);
              setActiveFilters({
                limit: 10,
                search: undefined,
                sort: ['createdAt'],
                direction: ['desc'],
              });
            }}
          />
          <div className="min-h-0 flex-1">
            <DataGrid table={table} />
          </div>
          <DataTablePagination table={table} rowCount={totalCount} />
        </CardContent>
      </Card>

      <TermEditorDialog key={`${editorOpen}-${editingTerm?.id ?? 'new'}-${activeGroupId}`} open={editorOpen} term={editingTerm} termGroupId={activeGroupId} isSaving={isSaving} onOpenChange={setEditorOpen} onSave={handleSave} />
      <TermGroupEditorDialog key={`${groupEditorOpen}-${editingGroup?.id ?? 'new'}`} open={groupEditorOpen} group={editingGroup} isSaving={isGroupSaving} onOpenChange={setGroupEditorOpen} onSave={handleSaveGroup} />
      <TermViewDialog key={viewingTerm?.id ?? 'none'} open={Boolean(viewingTerm)} term={viewingTerm} onOpenChange={(open) => !open && setViewingTerm(null)} />
    </div>
  );
}
