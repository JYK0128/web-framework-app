import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper, type SortingState } from '@tanstack/react-table';
import { useAtomValue } from 'jotai';
import { Ellipsis, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getOperatorTermsControllerGetOperatorTermGroupsV1QueryKey, getOperatorTermsControllerGetOperatorTermsV1QueryKey, useOperatorTermsControllerDeleteOperatorTermGroupV1, useOperatorTermsControllerDeleteOperatorTermV1, useOperatorTermsControllerGetOperatorTermGroupsV1, useOperatorTermsControllerGetOperatorTermsV1 } from '#/.generated/api/endpoints/operator-terms/operator-terms';
import type { OperatorTermGroupItemDto, OperatorTermItemDto, OperatorTermsControllerGetOperatorTermsV1Params } from '#/.generated/api/model';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { DataGrid, DataGridToolbar, DataTablePagination, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard, SideMainSection } from '#/components/layout';
import { openModal } from '#/components/modal';
import { TermGroupList } from '#/components/terms/term-group-list';
import { TermEditorModal, TermGroupEditorModal, TermViewModal } from '#/routes/_protected/_app/-terms-management-modals';
import { authUserAtom } from '#/store/auth';

export const Route = createFileRoute('/_protected/_app/terms/')({ component: TermsManagementPage });

const termColumn = createColumnHelper<OperatorTermItemDto>();

function TermsManagementPage() {
  const user = useAtomValue(authUserAtom);
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const groupsQuery = useOperatorTermsControllerGetOperatorTermGroupsV1();
  const groups = groupsQuery.data?.data.items ?? [];
  const activeGroupId = groups.some((group) => group.id === selectedGroupId) ? selectedGroupId : groups[0]?.id ?? '';
  const selectedGroup = groups.find((group) => group.id === activeGroupId);
  const permissions = user?.permissions ?? [];
  const canCreate = permissions.includes('terms:create');
  const canUpdate = permissions.includes('terms:update');
  const canDelete = permissions.includes('terms:delete');

  const queryParams: OperatorTermsControllerGetOperatorTermsV1Params = {
    page,
    limit: 20,
    groupId: activeGroupId || undefined,
    search: search.trim() || undefined,
    sort: sorting.map(({ id }) => id),
    direction: sorting.map(({ desc }) => (desc ? 'desc' : 'asc')),
  };
  const termsQuery = useOperatorTermsControllerGetOperatorTermsV1(queryParams, { query: { enabled: Boolean(activeGroupId) } });
  const response = termsQuery.data?.data;
  const terms = response?.items ?? [];

  const invalidateGroups = () => queryClient.invalidateQueries({ queryKey: getOperatorTermsControllerGetOperatorTermGroupsV1QueryKey() });
  const deleteGroup = useOperatorTermsControllerDeleteOperatorTermGroupV1();
  const deleteTerm = useOperatorTermsControllerDeleteOperatorTermV1();

  const openView = useCallback((term: OperatorTermItemDto) => {
    void openModal(TermViewModal, { term });
  }, []);
  const openGroupEditor = (group?: OperatorTermGroupItemDto) => {
    void openModal(TermGroupEditorModal, { group }).then((id) => {
      if (id) setSelectedGroupId(id);
    });
  };
  const openTermEditor = useCallback((term?: OperatorTermItemDto) => {
    if (!activeGroupId) return;
    void openModal(TermEditorModal, { term, termGroupId: activeGroupId, termGroupTitle: selectedGroup?.title ?? '' }).then((saved) => {
      if (saved) void queryClient.invalidateQueries({ queryKey: getOperatorTermsControllerGetOperatorTermsV1QueryKey() });
    });
  }, [activeGroupId, queryClient, selectedGroup?.title]);
  const handleDeleteGroup = async (group: OperatorTermGroupItemDto) => {
    if (!await confirm({ title: '약관 그룹 삭제', description: `${group.title} 그룹을 삭제하시겠습니까? 게시된 버전이 있으면 삭제할 수 없습니다.`, tone: 'danger' })) return;
    await deleteGroup.mutateAsync({ id: group.id });
    if (activeGroupId === group.id) {
      setSelectedGroupId(groups.find((item) => item.id !== group.id)?.id ?? '');
      setPage(1);
    }
    await invalidateGroups();
  };
  const handleDeleteTerm = useCallback(async (term: OperatorTermItemDto) => {
    if (!await confirm({ title: '약관 삭제', description: `${term.title} v${term.version} 초안을 삭제하시겠습니까?`, tone: 'danger' })) return;
    await deleteTerm.mutateAsync({ id: term.id });
    await queryClient.invalidateQueries({ queryKey: getOperatorTermsControllerGetOperatorTermsV1QueryKey() });
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
    termColumn.accessor((term) => getPublicationStatus(term), {
      id: 'publication-status',
      header: '상태',
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterMultiple: false,
        filterOptions: [
          { label: '게시됨', value: 'published' },
          { label: '게시 예정', value: 'scheduled' },
          { label: '초안', value: 'draft' },
        ],
      },
      filterFn: (row, id, value) => !Array.isArray(value) || value.length === 0 || row.getValue(id) === value[0],
      cell: ({ getValue }) => {
        const status = getValue();
        return <StatusText tone={status === 'published' ? 'success' : status === 'scheduled' ? 'info' : 'neutral'}>{publicationStatusLabels[status]}</StatusText>;
      },
    }),
    termColumn.accessor('isNoticeRequired', {
      header: '고지 여부',
      enableColumnFilter: true,
      meta: {
        filterType: 'faceted',
        filterMultiple: false,
        filterOptions: [
          { label: '고지', value: 'true' },
          { label: '고지 안 함', value: 'false' },
        ],
      },
      filterFn: (row, id, value) => !Array.isArray(value) || value.length === 0 || String(row.getValue(id)) === value[0],
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
      header: '도구',
      cell: ({ row }) => {
        const term = row.original;
        return (
          <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button
                    {...props}
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="도구"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onClick?.(event);
                    }}
                  >
                    <Ellipsis className="size-4" />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onClick={() => openView(term)}>
                  <Eye className="size-4" />
                  상세
                </DropdownMenuItem>
                {canUpdate && !term.isPublished && (
                  <DropdownMenuItem onClick={() => openTermEditor(term)}>
                    <Pencil className="size-4" />
                    수정
                  </DropdownMenuItem>
                )}
                {canDelete && !term.isPublished && (
                  <DropdownMenuItem variant="destructive" onClick={() => void handleDeleteTerm(term)}>
                    <Trash2 className="size-4" />
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ], [canDelete, canUpdate, handleDeleteTerm, openTermEditor, openView]);

  const table = useDataGrid({
    client: true,
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
    <PageSection icon="file-text" title="운영자 약관 관리" description="운영자 온보딩에 적용되는 약관 그룹과 버전을 관리합니다.">
      <PageSection.Content>
        <SideMainSection>
          <SideMainSection.Side>
            <SectionCard textSize="sm" title="약관 그룹" description="약관의 종류와 필수 동의 여부를 관리합니다.">
              <SectionCard.Actions>
                {canCreate && (
                  <Button type="button" variant="outline" onClick={() => openGroupEditor()}>
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
                  <Button type="button" variant="outline" onClick={() => openTermEditor()}>
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
          </SideMainSection.Main>
        </SideMainSection>
      </PageSection.Content>
    </PageSection>
  );
}

type PublicationStatus = 'published' | 'scheduled' | 'draft';

const publicationStatusLabels: Record<PublicationStatus, string> = {
  published: '게시됨',
  scheduled: '게시 예정',
  draft: '초안',
};

function getPublicationStatus(term: OperatorTermItemDto): PublicationStatus {
  if (term.isPublished) return 'published';
  if (term.publishedAt) return 'scheduled';
  return 'draft';
}

function StatusText({ children, tone }: { children: string, tone: 'neutral' | 'info' | 'success' }) {
  return (
    <span className={tone === 'success'
      ? `
        font-semibold text-emerald-600
        dark:text-emerald-400
      `
      : tone === 'info'
        ? `
          font-semibold text-blue-600
          dark:text-blue-400
        `
        : `font-semibold text-muted-foreground`}
    >
      {children}
    </span>
  );
}
