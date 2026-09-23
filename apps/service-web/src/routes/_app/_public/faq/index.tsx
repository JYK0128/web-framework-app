import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';

import { useFaqsControllerGetFaqsV1 } from '#/.generated/api/endpoints/faqs/faqs';
import { Button, Input, Skeleton } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/layout';

const searchSchema = z.object({ search: z.string().optional(), category: z.string().optional() });

export const Route = createFileRoute('/_app/_public/faq/')({
  validateSearch: searchSchema,
  component: FaqPage,
});

function FaqPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/faq/' });
  const [searchText, setSearchText] = useState(search.search ?? '');
  const query = useFaqsControllerGetFaqsV1({ search: search.search, category: search.category, page: 1, limit: 100, sort: ['sortOrder', 'createdAt'], direction: ['asc', 'desc'] });

  const updateSearch = (values: { search?: string, category?: string }) => {
    void navigate({ search: (previous) => ({ ...previous, ...values, search: values.search || undefined, category: values.category || undefined }), replace: true });
  };

  return (
    <>
      <div className="
        mx-auto w-full max-w-6xl px-6 py-8
        md:px-8
      "
      >
        <PageSection icon="circle-help" title="FAQ" description="자주 묻는 질문을 확인하세요.">
          <PageSection.Content className="
            mx-auto grid w-full max-w-4xl gap-4 pt-2
          "
          >
            <div className="flex flex-wrap gap-2">
              <Input className="max-w-md" value={searchText} placeholder="질문 또는 답변 검색" onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') updateSearch({ search: searchText }); }} />
              <Button variant="secondary" onClick={() => updateSearch({ search: searchText })}>검색</Button>
              <select
                aria-label="FAQ 카테고리"
                className="
                  h-8 rounded-lg border border-input bg-background px-2 text-sm
                "
                value={search.category ?? ''}
                onChange={(event) => updateSearch({ category: event.target.value })}
              >
                <option value="">전체 카테고리</option>
                {(query.data?.data.categories ?? []).map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
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
            {!query.isLoading && !query.isError && query.data?.data.items.length === 0 && (
              <SectionCard variant="secondary">
                <SectionCard.Content className="p-6 text-muted-foreground">
                  조건에 맞는 FAQ가 없습니다.
                </SectionCard.Content>
              </SectionCard>
            )}
            {!query.isLoading && !query.isError && (
              <div className="grid gap-2">
                {(query.data?.data.items ?? []).map((faq) => (
                  <SectionCard key={faq.id} variant="outline">
                    <SectionCard.Content className="p-4">
                      <details>
                        <summary className="cursor-pointer font-medium">
                          <span className="mr-2 text-xs text-primary">{faq.category}</span>
                          {faq.question}
                        </summary>
                        <p className="
                          mt-3 whitespace-pre-wrap border-t pt-3 text-sm
                          text-muted-foreground
                        "
                        >
                          {faq.answer}
                        </p>
                      </details>
                    </SectionCard.Content>
                  </SectionCard>
                ))}
              </div>
            )}
          </PageSection.Content>
        </PageSection>
      </div>
    </>
  );
}
