import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, type SortingState } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { Eye, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getTermsControllerGetAdminTermGroupsV1QueryKey, getTermsControllerGetAdminTermsV1QueryKey, useTermsControllerDeleteTermGroupV1, useTermsControllerDeleteTermV1, useTermsControllerGetAdminTermGroupsV1, useTermsControllerGetAdminTermsV1, useTermsControllerPublishTermV1 } from '#/.generated/api/endpoints/terms/terms';
import type { AdminTermGroupItemDto, AdminTermItemDto, TermsControllerGetAdminTermsV1Params } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { FormLayout, useAppForm } from '#/components/form';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { authUserAtom } from '#/store/auth';

import { TermEditorModal, TermGroupEditorModal, TermViewModal } from '../-terms-management-modals';

export const Route = createFileRoute('/_protected/_app/terms')({ component: TermsManagementPage });

const termColumn = createColumnHelper<AdminTermItemDto>();

function TermsManagementPage() {
  const user = useAtomValue(authUserAtom);
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const groupsQuery = useTermsControllerGetAdminTermGroupsV1();
  const groups = groupsQuery.data?.data.items ?? [];
  const activeGroupId = groups.some((group) => group.id === selectedGroupId) ? selectedGroupId : groups[0]?.id ?? '';
  const selectedGroup = groups.find((group) => group.id === activeGroupId);
  const permissions = user?.permissions ?? [];
  const canCreate = permissions.includes('terms:create');
  const canUpdate = permissions.includes('terms:update');
  const canDelete = permissions.includes('terms:delete');
  const canPublish = permissions.includes('terms:publish');

  const queryParams: TermsControllerGetAdminTermsV1Params = {
    page,
    limit: 20,
    groupId: activeGroupId || undefined,
    search: search.trim() || undefined,
    sort: sorting.map(({ id }) => id),
    direction: sorting.map(({ desc }) => (desc ? 'desc' : 'asc')),
  };
  const termsQuery = useTermsControllerGetAdminTermsV1(queryParams, { query: { enabled: Boolean(activeGroupId) } });
  const response = termsQuery.data?.data;
  const terms = response?.items ?? [];

  const invalidateGroups = () => queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermGroupsV1QueryKey() });
  const deleteGroup = useTermsControllerDeleteTermGroupV1();
  const deleteTerm = useTermsControllerDeleteTermV1();
  const publishTerm = useTermsControllerPublishTermV1();

  const openView = useCallback((term: AdminTermItemDto) => {
    void openModal(TermViewModal, { term });
  }, []);
  const openGroupEditor = (group?: AdminTermGroupItemDto) => {
    void openModal(TermGroupEditorModal, { group }).then((id) => {
      if (id) setSelectedGroupId(id);
    });
  };
  const openTermEditor = useCallback((term?: AdminTermItemDto) => {
    if (!activeGroupId) return;
    void openModal(TermEditorModal, { term, termGroupId: activeGroupId }).then((saved) => {
      if (saved) void queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsV1QueryKey() });
    });
  }, [activeGroupId, queryClient]);
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!await confirm({ title: '약관 그룹 삭제', description: `${selectedGroup.title} 그룹을 삭제하시겠습니까? 그룹에 약관이 있으면 삭제할 수 없습니다.`, tone: 'danger' })) return;
    await deleteGroup.mutateAsync({ id: selectedGroup.id });
    setSelectedGroupId('');
    await invalidateGroups();
  };
  const handleDeleteTerm = useCallback(async (term: AdminTermItemDto) => {
    if (!await confirm({ title: '약관 삭제', description: `${term.title} v${term.version} 초안을 삭제하시겠습니까?`, tone: 'danger' })) return;
    await deleteTerm.mutateAsync({ id: term.id });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsV1QueryKey() });
  }, [deleteTerm, queryClient]);
  const handlePublishTerm = useCallback(async (term: AdminTermItemDto) => {
    if (!await confirm({ title: '약관 게시', description: `${term.title} v${term.version}을 게시하시겠습니까? 게시 후에는 수정하거나 삭제할 수 없습니다.` })) return;
    await publishTerm.mutateAsync({ id: term.id });
    await queryClient.invalidateQueries({ queryKey: getTermsControllerGetAdminTermsV1QueryKey() });
  }, [publishTerm, queryClient]);

  const columns = useMemo(() => [
    termColumn.accessor('title', {
      header: '약관',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.code}
          </p>
        </div>
      ),
    }),
    termColumn.accessor('version', {
      header: '버전',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">
          v
          {getValue()}
        </span>
      ),
    }),
    termColumn.accessor('isPublished', {
      header: '상태',
      cell: ({ getValue }) => <StatusText tone={getValue() ? 'success' : 'neutral'}>{getValue() ? '게시됨' : '초안'}</StatusText>,
    }),
    termColumn.accessor('createdAt', {
      header: '등록일',
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString('ko-KR')}</span>,
    }),
    termColumn.display({
      id: 'actions',
      header: '관리',
      cell: ({ row }) => {
        const term = row.original;
        return (
          <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <Button type="button" variant="ghost" size="icon" aria-label="약관 상세" onClick={() => openView(term)}>
              <Eye className="size-4" />
            </Button>
            {canUpdate && !term.isPublished && (
              <Button type="button" variant="ghost" size="icon" aria-label="약관 수정" onClick={() => openTermEditor(term)}>
                <Pencil className="size-4" />
              </Button>
            )}
            {canPublish && !term.isPublished && (
              <Button type="button" variant="ghost" size="icon" aria-label="약관 게시" onClick={() => void handlePublishTerm(term)}>
                <Send className="size-4" />
              </Button>
            )}
            {canDelete && !term.isPublished && (
              <Button type="button" variant="ghost" size="icon" aria-label="약관 삭제" onClick={() => void handleDeleteTerm(term)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    }),
  ], [canDelete, canPublish, canUpdate, handleDeleteTerm, handlePublishTerm, openTermEditor, openView]);

  const table = useDataGrid({
    client: false,
    data: terms,
    columns,
    pageCount: response?.totalPages ?? 1,
    initialState: { pagination: { pageIndex: page - 1, pageSize: 20 }, globalFilter: search, sorting },
    onPaginationChange: ({ pageIndex }) => setPage(pageIndex + 1),
    onGlobalFilterChange: (value) => {
      setPage(1);
      setSearch(typeof value === 'string' ? value : '');
    },
    onSortingChange: (value) => {
      setPage(1);
      setSorting(value);
    },
  });

  return (
    <PageSection icon="file-text" title="약관 관리" description="관리자 온보딩에 적용되는 약관 그룹과 버전을 관리합니다.">
      <PageSection.Content className="
        scroll-y grid grid-rows-[auto_minmax(0,1fr)] gap-6 p-2
      "
      >
        <SectionCard textSize="sm" title="약관 그룹" description="약관의 종류와 필수 동의 여부를 관리합니다.">
          <SectionCard.Actions>
            {canCreate && (
              <Button type="button" onClick={() => openGroupEditor()}>
                <Plus className="size-4" />
                그룹 추가
              </Button>
            )}
          </SectionCard.Actions>
          <SectionCard.Content>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {groups.length > 0
                ? (
                  <TermGroupSelector
                    key={activeGroupId}
                    groups={groups}
                    value={activeGroupId}
                    onChange={(value) => {
                      setSelectedGroupId(value);
                      setPage(1);
                    }}
                  />
                )
                : <p className="text-sm text-muted-foreground">등록된 약관 그룹이 없습니다.</p>}
              {selectedGroup && (
                <div className="flex items-center gap-2">
                  {canUpdate && <Button type="button" variant="ghost" size="sm" onClick={() => openGroupEditor(selectedGroup)}>그룹 수정</Button>}
                  {canDelete && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void handleDeleteGroup()}>
                      <Trash2 className="size-4 text-destructive" />
                      그룹 삭제
                    </Button>
                  )}
                </div>
              )}
            </div>
          </SectionCard.Content>
        </SectionCard>

        <SectionCard textSize="sm" title="약관 버전" description={selectedGroup ? `${selectedGroup.title} 그룹의 약관 버전 목록입니다.` : '약관 그룹을 선택해 주세요.'}>
          {selectedGroup && canCreate && (
            <SectionCard.Actions>
              <Button type="button" onClick={() => openTermEditor()}>
                <Plus className="size-4" />
                버전 추가
              </Button>
            </SectionCard.Actions>
          )}
          <SectionCard.Content className="
            grid h-full grid-rows-[auto_minmax(0,1fr)_auto]
          "
          >
            <DataGridToolbar
              table={table}
              searchPlaceholder="약관 버전 또는 내용 검색..."
              onReset={() => {
                setPage(1);
                setSearch('');
                setSorting([{ id: 'createdAt', desc: true }]);
              }}
            />
            {selectedGroup
              ? <DataGrid table={table} onRowClick={(row) => openView(row.original)} />
              : (
                <div className="
                  grid place-items-center p-8 text-sm text-muted-foreground
                "
                >
                  약관 그룹을 선택해 주세요.
                </div>
              )}
            <DataTablePagination table={table} rowCount={response?.totalCount ?? 0} />
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}

function StatusText({ children, tone }: { children: string, tone: 'neutral' | 'success' }) {
  return (
    <span className={tone === 'success'
      ? `
        font-semibold text-emerald-600
        dark:text-emerald-400
      `
      : `font-semibold text-muted-foreground`}
    >
      {children}
    </span>
  );
}

function TermGroupSelector({ groups, value, onChange }: { groups: AdminTermGroupItemDto[], value: string, onChange: (value: string) => void }) {
  const form = useAppForm({
    defaultValues: { groupId: value },
    onSubmit: async () => undefined,
  });

  return (
    <form.AppForm>
      <FormLayout
        onSubmit={() => undefined}
        className="grid w-full max-w-md gap-0"
      >
        <form.AppField name="groupId">
          {(field) => (
            <field.Select
              placeholder="약관 그룹 선택"
              className="w-full"
              options={groups.map((group) => ({ label: `${group.title} (${group.code})`, value: group.id }))}
              showError={false}
              onValueChange={(nextValue) => {
                if (typeof nextValue === 'string') onChange(nextValue);
              }}
            />
          )}
        </form.AppField>
      </FormLayout>
    </form.AppForm>
  );
}
