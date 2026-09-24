import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, type SortingState } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getServiceTermsControllerGroupsV1QueryKey, getServiceTermsControllerListV1QueryKey, useServiceTermsControllerDeleteGroupV1, useServiceTermsControllerDeleteV1, useServiceTermsControllerGroupsV1, useServiceTermsControllerListV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import type { ServiceTermGroupItemDto, ServiceTermItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard, SideMainSection } from '#/components/layout';
import { openModal } from '#/components/modal';
import { TermGroupList } from '#/components/terms/term-group-list';
import { authUserAtom } from '#/store/auth';

import { ServiceTermEditorModal } from './-components/service-term-editor-modal';
import { ServiceTermGroupEditorModal } from './-components/service-term-group-editor-modal';
import { ServiceTermViewModal } from './-components/service-term-view-modal';

export const Route = createFileRoute('/_protected/_app/service-terms/')({ component: ServiceTermsManagementPage });
const termColumn = createColumnHelper<ServiceTermItemDto>();

function ServiceTermsManagementPage() {
  const user = useAtomValue(authUserAtom);
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const groupsQuery = useServiceTermsControllerGroupsV1();
  const groups = groupsQuery.data?.data.items ?? [];
  const activeGroupId = groups.some((group) => group.id === selectedGroupId) ? selectedGroupId : groups[0]?.id ?? '';
  const selectedGroup = groups.find((group) => group.id === activeGroupId);
  const permissions = user?.permissions ?? [];
  const canCreate = permissions.includes('service_term:create');
  const canUpdate = permissions.includes('service_term:update');
  const canDelete = permissions.includes('service_term:delete');
  const termsQuery = useServiceTermsControllerListV1({
    page,
    limit: 20,
    groupId: selectedGroup?.id,
    search: search.trim() || undefined,
    sort: sorting.map(({ id }) => id),
    direction: sorting.map(({ desc }) => desc ? 'desc' : 'asc'),
  }, { query: { enabled: Boolean(selectedGroup) } });
  const response = termsQuery.data?.data;
  const terms = response?.items ?? [];
  const deleteGroup = useServiceTermsControllerDeleteGroupV1();
  const deleteTerm = useServiceTermsControllerDeleteV1();

  const openGroupEditor = useCallback((group?: ServiceTermGroupItemDto) => {
    void openModal(ServiceTermGroupEditorModal, { group }).then((id) => {
      if (id) setSelectedGroupId(id);
    });
  }, []);
  const openTermEditor = useCallback((term?: ServiceTermItemDto) => {
    if (selectedGroup) void openModal(ServiceTermEditorModal, { term, group: selectedGroup });
  }, [selectedGroup]);
  const openTermView = useCallback((term: ServiceTermItemDto) => {
    void openModal(ServiceTermViewModal, { term });
  }, []);
  const handleDeleteGroup = async (group: ServiceTermGroupItemDto) => {
    if (!await confirm({
      title: '서비스 약관 그룹 삭제',
      description: `${group.title} 그룹을 삭제하시겠습니까? 게시된 버전이 있으면 삭제할 수 없습니다.`,
      tone: 'danger',
    })) return;
    await deleteGroup.mutateAsync({ id: group.id });
    if (activeGroupId === group.id) {
      setSelectedGroupId(groups.find((item) => item.id !== group.id)?.id ?? '');
      setPage(1);
    }
    await queryClient.invalidateQueries({ queryKey: getServiceTermsControllerGroupsV1QueryKey() });
  };
  const handleDeleteTerm = useCallback(async (term: ServiceTermItemDto) => {
    if (!await confirm({
      title: '서비스 약관 삭제',
      description: `${term.title} v${term.version}을 삭제하시겠습니까?`,
      tone: 'danger',
    })) return;
    await deleteTerm.mutateAsync({ id: term.id });
    await queryClient.invalidateQueries({ queryKey: getServiceTermsControllerListV1QueryKey() });
  }, [deleteTerm, queryClient]);
  const columns = useMemo(() => [
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
      enableSorting: false,
      cell: ({ getValue }) => <StatusText tone={getValue() ? 'success' : 'neutral'}>{getValue() ? '게시됨' : '초안'}</StatusText>,
    }),
    termColumn.accessor('isNoticeRequired', {
      header: '고지 여부',
      cell: ({ getValue }) => <StatusText tone={getValue() ? 'success' : 'neutral'}>{getValue() ? '고지' : '고지 안 함'}</StatusText>,
    }),
    termColumn.accessor('publishedAt', {
      header: '게시일',
      cell: ({ getValue, row }) => {
        const value = getValue();
        if (!value) return <span className="text-xs text-muted-foreground">미정</span>;
        const date = new Date(value);
        const label = `${row.original.isPublished ? '' : '예정 · '}${date.toLocaleString('ko-KR')}`;
        return <span className="text-xs text-muted-foreground">{label}</span>;
      },
    }),
    termColumn.accessor('createdAt', {
      header: '등록일시',
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleString('ko-KR')}</span>,
    }),
    termColumn.display({
      id: 'tools',
      header: '관리',
      cell: ({ row }) => {
        const term = row.original;
        return (
          <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            <Button type="button" variant="ghost" size="icon" aria-label="약관 상세" onClick={() => openTermView(term)}>
              <Eye className="size-4" />
            </Button>
            {canUpdate && !term.isPublished && (
              <Button type="button" variant="ghost" size="icon" aria-label="약관 수정" onClick={() => openTermEditor(term)}>
                <Pencil className="size-4" />
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
  ], [canDelete, canUpdate, handleDeleteTerm, openTermEditor, openTermView]);
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
    <PageSection icon="file-signature" title="서비스 약관 관리" description="고객에게 공개되는 서비스 약관 그룹과 버전을 관리합니다.">
      <PageSection.Content>
        <SideMainSection>
          <SideMainSection.Side>
            <SectionCard textSize="sm" title="약관 그룹" description="약관의 종류와 필수 동의 여부를 관리합니다.">
              <SectionCard.Actions>
                {canCreate && (
                  <Button type="button" onClick={() => openGroupEditor()}>
                    <Plus className="size-4" />
                    그룹 추가
                  </Button>
                )}
              </SectionCard.Actions>
              <SectionCard.Content className="scroll-y">
                <TermGroupList
                  groups={groups}
                  selectedId={activeGroupId}
                  onSelect={(id) => {
                    setSelectedGroupId(id);
                    setPage(1);
                  }}
                  onEdit={canUpdate ? openGroupEditor : undefined}
                  onDelete={canDelete ? (group) => void handleDeleteGroup(group) : undefined}
                />
              </SectionCard.Content>
            </SectionCard>
          </SideMainSection.Side>
          <SideMainSection.Main>
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
                  ? <DataGrid table={table} onRowClick={(row) => openTermView(row.original)} />
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
          </SideMainSection.Main>
        </SideMainSection>
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
