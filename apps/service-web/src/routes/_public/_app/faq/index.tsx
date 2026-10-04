import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { faqsControllerGetFaqsV1 } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItem, FaqsControllerGetFaqsV1Category, FaqsControllerGetFaqsV1SortItem, SortDirection } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { DATA_GRID_PAGE_SIZE } from '#/configs/list.config';

const searchSchema = z.object({ search: z.string().optional(), category: z.string().optional() });

export const Route = createFileRoute('/_public/_app/faq/')({
  validateSearch: searchSchema,
  component: FaqPage,
});

const columnHelper = createColumnHelper<FaqItem>();

function FaqPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/faq/' });
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const queryParams = useMemo(() => ({
    search: search.search,
    category: search.category as FaqsControllerGetFaqsV1Category | undefined,
    limit: DATA_GRID_PAGE_SIZE,
    sort: ['sortOrder', 'createdAt'] as FaqsControllerGetFaqsV1SortItem[],
    direction: ['asc', 'desc'] as SortDirection[],
  }), [search.category, search.search]);
  const query = useInfiniteQuery({
    queryKey: ['public-faqs', queryParams],
    queryFn: ({ pageParam, signal }) => faqsControllerGetFaqsV1({ ...queryParams, cursor: pageParam }, undefined, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.hasNextPage && lastPage.endCursor ? lastPage.endCursor : undefined,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const categories = query.data?.pages[0]?.categories ?? [];
  const columns = useMemo(() => [
    columnHelper.accessor('category', { header: '카테고리', size: 100, minSize: 80, enableSorting: false }),
    columnHelper.accessor('question', {
      header: '질문',
      minSize: 320,
      cell: ({ row, getValue }) => {
        const expanded = expandedFaqId === row.original.id;
        return (
          <button
            type="button"
            className="flex w-full items-center gap-3 text-left"
            aria-expanded={expanded}
            aria-controls={`faq-answer-${row.original.id}`}
            onClick={() => setExpandedFaqId(expanded ? null : row.original.id)}
          >
            <span className="flex-1 truncate font-medium">{getValue()}</span>
            <ChevronDown className={`
              size-4 shrink-0 text-muted-foreground transition-transform
              ${expanded
            ? `rotate-180`
            : ''}
            `}
            />
          </button>
        );
      },
    }),
  ], [expandedFaqId]);
  const table = useDataGrid({
    client: false,
    cursor: true,
    data: items,
    columns,
    getRowId: (row) => row.id,
    initialState: { globalFilter: search.search ?? '' },
    onGlobalFilterChange: (value) => {
      const nextSearch = typeof value === 'string' ? value.trim() : '';
      if (nextSearch === (search.search ?? '')) return;
      setExpandedFaqId(null);
      void navigate({ search: (previous) => ({ ...previous, search: nextSearch || undefined }), replace: true });
    },
  });

  useEffect(() => {
    if (table.getState().globalFilter !== (search.search ?? '')) table.setGlobalFilter(search.search ?? '');
  }, [search.search, table]);

  const updateSearch = (values: { search?: string, category?: string }) => {
    setExpandedFaqId(null);
    void navigate({ search: (previous) => ({ ...previous, ...values, ...(values.search !== undefined ? { search: values.search || undefined } : {}), ...(values.category !== undefined ? { category: values.category || undefined } : {}) }), replace: true });
  };

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="circle-help" title="FAQ" description="자주 묻는 질문을 확인하세요.">
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
              <div className="flex flex-wrap items-center gap-2.5 px-4 pt-4">
                <span className="
                  mr-1 text-xs font-semibold text-muted-foreground
                "
                >
                  카테고리
                </span>
                <div
                  role="group"
                  aria-label="FAQ 카테고리"
                  className="flex flex-wrap gap-2"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant={search.category ? 'outline' : 'default'}
                    className="rounded-full px-4"
                    aria-pressed={!search.category}
                    onClick={() => updateSearch({ category: '' })}
                  >
                    전체
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      size="sm"
                      variant={search.category === category ? 'default' : 'outline'}
                      className="rounded-full px-4"
                      aria-pressed={search.category === category}
                      onClick={() => updateSearch({ category: category === search.category ? '' : category })}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
              <DataGridToolbar
                table={table}
                searchPlaceholder="질문 또는 답변 검색"
                onReset={() => updateSearch({ search: '', category: '' })}
              />
              <div className="grid grid-rows-[minmax(0,1fr)] overflow-hidden">
                {query.isLoading && (
                  <div className="grid content-start gap-3 p-4">
                    {[1, 2, 3].map((item) => (
                      <Skeleton
                        key={item}
                        className="h-16 w-full"
                      />
                    ))}
                  </div>
                )}
                {query.isError && (
                  <p className="p-6 text-sm text-destructive">FAQ를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
                )}
                {!query.isLoading && !query.isError && items.length === 0 && (
                  <p className="p-6 text-sm text-muted-foreground">조건에 맞는 FAQ가 없습니다.</p>
                )}
                {!query.isLoading && !query.isError && items.length > 0 && (
                  <DataGrid
                    key={`${search.search ?? ''}:${search.category ?? ''}`}
                    table={table}
                    hasMore={query.hasNextPage}
                    onScrollEnd={async () => { await query.fetchNextPage(); }}
                    isSubComponentVisible={(row) => expandedFaqId === row.original.id}
                    renderSubComponent={(row) => (
                      <div
                        id={`faq-answer-${row.original.id}`}
                        className="
                          whitespace-pre-wrap text-sm text-muted-foreground
                        "
                      >
                        {row.original.answer}
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
