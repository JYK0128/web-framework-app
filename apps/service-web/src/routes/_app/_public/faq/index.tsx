import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { z } from 'zod';

import { faqsControllerGetFaqsV1 } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItem, FaqsControllerGetFaqsV1Category, FaqsControllerGetFaqsV1SortItem, SortDirection } from '#/.generated/api/model';
import { Button, Input, Skeleton } from '#/.generated/shadcn/components/ui';
import { DataGrid, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';

const searchSchema = z.object({ search: z.string().optional(), category: z.string().optional() });

export const Route = createFileRoute('/_app/_public/faq/')({
  validateSearch: searchSchema,
  component: FaqPage,
});

const columnHelper = createColumnHelper<FaqItem>();

function FaqPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/faq/' });
  const [searchText, setSearchText] = useState(search.search ?? '');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const queryParams = useMemo(() => ({
    search: search.search,
    category: search.category as FaqsControllerGetFaqsV1Category | undefined,
    limit: 20,
    sort: ['sortOrder', 'createdAt'] as FaqsControllerGetFaqsV1SortItem[],
    direction: ['asc', 'desc'] as SortDirection[],
  }), [search.category, search.search]);
  const query = useInfiniteQuery({
    queryKey: ['public-faqs', queryParams],
    queryFn: ({ pageParam, signal }) => faqsControllerGetFaqsV1({ ...queryParams, cursor: pageParam }, undefined, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.data.hasNextPage && lastPage.data.endCursor ? lastPage.data.endCursor : undefined,
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.data.items) ?? [], [query.data]);
  const categories = query.data?.pages[0]?.data.categories ?? [];
  const columns = useMemo(() => [
    columnHelper.accessor('question', {
      header: '질문',
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
            <span className="shrink-0 text-xs text-primary">{row.original.category}</span>
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
  });

  const updateSearch = (values: { search?: string, category?: string }) => {
    setExpandedFaqId(null);
    void navigate({ search: (previous) => ({ ...previous, ...values, search: values.search || undefined, category: values.category || undefined }), replace: true });
  };

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="circle-help" title="FAQ" description="자주 묻는 질문을 확인하세요.">
        <PageSection.Content className="
          mx-auto grid size-full w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)]
          gap-4 pt-2
        "
        >
          <div className="grid gap-4 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="mr-1 text-xs font-semibold text-muted-foreground">카테고리</span>
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
            <form
              className="flex w-full max-w-2xl gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                updateSearch({ search: searchText });
              }}
            >
              <Input className="h-10 flex-1 bg-background" value={searchText} placeholder="질문 또는 답변 검색" onChange={(event) => setSearchText(event.target.value)} />
              <Button type="submit" className="h-10 px-4">
                <Search />
                검색
              </Button>
            </form>
          </div>
          {query.isLoading && (
            <div className="grid gap-3">
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  className="h-16 w-full"
                />
              ))}
            </div>
          )}
          {query.isError && (
            <SectionCard variant="destructive">
              <SectionCard.Content className="p-6 text-destructive">
                FAQ를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </SectionCard.Content>
            </SectionCard>
          )}
          {!query.isLoading && !query.isError && items.length === 0 && (
            <SectionCard variant="secondary">
              <SectionCard.Content className="p-6 text-muted-foreground">
                조건에 맞는 FAQ가 없습니다.
              </SectionCard.Content>
            </SectionCard>
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
                  className="whitespace-pre-wrap text-sm text-muted-foreground"
                >
                  {row.original.answer}
                </div>
              )}
            />
          )}
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
