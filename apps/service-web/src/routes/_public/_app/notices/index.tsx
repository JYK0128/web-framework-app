import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { noticesControllerListV1 } from '#/.generated/api/endpoints/notices/notices';
import type { NoticeItem } from '#/.generated/api/model';
import { Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { EditorViewer } from '#/components/editor';
import { PageSection, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/_public/_app/notices/')({ component: NoticesPage });

const columnHelper = createColumnHelper<NoticeItem>();

function NoticesPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['public-notices', search],
    queryFn: ({ pageParam, signal }) => noticesControllerListV1({ limit: 20, cursor: pageParam, search }, undefined, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'importance',
      header: '구분',
      size: 110,
      minSize: 90,
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          {row.original.isPinned && <span className="font-semibold text-primary">고정</span>}
          <span className={row.original.importance === 'urgent'
            ? `font-semibold text-destructive`
            : ''}
          >
            {{ normal: '일반', important: '중요', urgent: '긴급' }[row.original.importance]}
          </span>
        </span>
      ),
    }),
    columnHelper.accessor('publishedAt', { header: '게시일', size: 120, minSize: 110, cell: ({ getValue }) => getValue() ? new Date(getValue()!).toLocaleDateString('ko-KR') : '' }),
    columnHelper.accessor('title', {
      header: '제목',
      minSize: 280,
      cell: ({ row, getValue }) => (
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left"
          aria-expanded={expandedId === row.original.id}
          aria-controls={`notices-content-${row.original.id}`}
          onClick={() => setExpandedId(expandedId === row.original.id ? null : row.original.id)}
        >
          <span className="flex-1 truncate font-medium">{getValue()}</span>
          <ChevronDown className={expandedId === row.original.id
            ? `size-4 shrink-0 rotate-180`
            : `size-4 shrink-0`}
          />
        </button>
      ),
    }),
  ], [expandedId]);
  const table = useDataGrid({
    client: false,
    cursor: true,
    data: items,
    columns,
    getRowId: (row) => row.id,
    rowCount: query.data?.pages[0]?.totalCount ?? 0,
    enableSorting: false,
    onGlobalFilterChange: (value) => {
      setSearch(typeof value === 'string' ? value.trim() : '');
      setExpandedId(null);
    },
  });

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="megaphone" title="공지사항" description="서비스의 주요 안내와 긴급 공지를 확인하세요." isLoading={query.isLoading}>
        <PageSection.Loading>
          <div className="grid content-start gap-3 p-4">
            {[1, 2, 3].map((item) => (
              <Skeleton
                key={item}
                className="h-16 w-full"
              />
            ))}
          </div>
        </PageSection.Loading>
        <PageSection.Content className="
          mx-auto grid size-full w-full max-w-4xl grid-rows-[minmax(0,1fr)]
          gap-4 pt-2
        "
        >
          <SectionCard textSize="sm">
            <SectionCard.Content className="
              grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden
            "
            >
              <DataGridToolbar table={table} searchPlaceholder="제목 또는 내용 검색" />
              <div className="grid grid-rows-[minmax(0,1fr)] overflow-hidden">
                {query.isError && <p className="p-6 text-sm text-destructive">공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
                {!query.isError && (
                  <DataGrid
                    key={search}
                    table={table}
                    hasMore={query.hasNextPage}
                    onScrollEnd={async () => { await query.fetchNextPage(); }}
                    isSubComponentVisible={(row) => expandedId === row.original.id}
                    renderSubComponent={(row) => (
                      <div
                        id={`notices-content-${row.original.id}`}
                        className="grid gap-3"
                      >
                        <EditorViewer
                          content={row.original.content}
                          className="text-sm/7"
                        />
                      </div>
                    )}
                  />
                )}
              </div>
            </SectionCard.Content>
          </SectionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
