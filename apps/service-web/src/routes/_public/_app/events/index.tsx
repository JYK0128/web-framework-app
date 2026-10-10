import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { eventsControllerListV1 } from '#/.generated/api/endpoints/events/events';
import type { EventItem, EventsControllerListV1Phase } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { EditorViewer } from '#/components/editor';
import { PageSection, SectionCard } from '#/components/layout';

export const Route = createFileRoute('/_public/_app/events/')({ component: EventsPage });

const columnHelper = createColumnHelper<EventItem>();

const phaseLabels = { ongoing: '진행 중', upcoming: '예정', ended: '종료' };

function getEventPhase(event: EventItem): EventsControllerListV1Phase {
  const now = Date.now();
  if (new Date(event.endsAt).getTime() <= now) return 'ended';
  return new Date(event.startsAt).getTime() > now ? 'upcoming' : 'ongoing';
}

function EventsPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<EventsControllerListV1Phase | 'all'>('all');
  const query = useInfiniteQuery({
    queryKey: ['public-events', search, phase],
    queryFn: ({ pageParam, signal }) => eventsControllerListV1({ limit: 20, cursor: pageParam, search, phase: phase === 'all' ? undefined : phase }, undefined, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const columns = useMemo(() => [
    columnHelper.display({ id: 'phase', header: '상태', size: 100, minSize: 80, cell: ({ row }) => phaseLabels[getEventPhase(row.original)] }),
    columnHelper.accessor('startsAt', { header: '기간', size: 210, minSize: 180, cell: ({ row }) => `${new Date(row.original.startsAt).toLocaleDateString('ko-KR')} – ${new Date(row.original.endsAt).toLocaleDateString('ko-KR')}` }),
    columnHelper.accessor('title', {
      header: '제목',
      minSize: 280,
      cell: ({ row, getValue }) => (
        <button
          type="button"
          className="flex w-full items-center gap-3 text-left"
          aria-expanded={expandedId === row.original.id}
          aria-controls={`events-content-${row.original.id}`}
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
      <PageSection icon="calendar-days" title="이벤트" description="진행 중인 이벤트부터 예정 및 종료된 이벤트까지 확인하세요." isLoading={query.isLoading}>
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
              grid h-full grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden
            "
            >
              <div className="flex flex-wrap gap-2 px-4 pt-4" role="group" aria-label="이벤트 진행 상태">
                {(['all', 'ongoing', 'upcoming', 'ended'] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={phase === value ? 'default' : 'outline'}
                    aria-pressed={phase === value}
                    onClick={() => {
                      setPhase(value);
                      setExpandedId(null);
                    }}
                  >
                    {value === 'all' ? '전체' : phaseLabels[value]}
                  </Button>
                ))}
              </div>
              <DataGridToolbar table={table} searchPlaceholder="제목 또는 내용 검색" />
              <div className="grid grid-rows-[minmax(0,1fr)] overflow-hidden">
                {query.isError && <p className="p-6 text-sm text-destructive">이벤트을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
                {!query.isError && (
                  <DataGrid
                    key={search + phase}
                    table={table}
                    hasMore={query.hasNextPage}
                    onScrollEnd={async () => { await query.fetchNextPage(); }}
                    isSubComponentVisible={(row) => expandedId === row.original.id}
                    renderSubComponent={(row) => (
                      <div
                        id={`events-content-${row.original.id}`}
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
