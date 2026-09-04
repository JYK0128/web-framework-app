import { createFileRoute } from '@tanstack/react-router';
import { MessageCircleQuestion } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useFaqsControllerGetFaqs } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Accordion, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';
import { PageSection, SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

import { createFaqColumns } from './-configs/faq-columns.config';

export const Route = createFileRoute('/_protected/_app/faq/')({
  component: FaqBoardPageComponent,
});

function FaqBoardPageComponent() {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const columns = useMemo(() => createFaqColumns(), []);

  const table = useDataGrid({
    client: true,
    data: [],
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  const { data, isLoading } = useFaqsControllerGetFaqs();

  const faqs: FaqItemDto[] = useMemo(() => {
    const items = data?.items ?? [];
    return selectedCategory === 'all'
      ? items
      : items.filter((faq) => faq.category === selectedCategory);
  }, [data?.items, selectedCategory]);

  const categoryOptions = useMemo(
    () => ['all', ...(data?.categories ?? [])],
    [data?.categories],
  );

  table.setOptions((options) => ({ ...options, data: faqs }));

  return (
    <PageSection
      icon="circle-help"
      title={t('faq.boardTitle')}
      description={t('faq.boardDescription')}
      isLoading={isLoading}
    >
      <PageSection.Loading>
        <div className="
          flex items-center justify-center text-sm text-muted-foreground
        "
        >
          {t('common.loading')}
        </div>
      </PageSection.Loading>
      <PageSection.Content className={cn(
        'grid grid-rows-[auto_minmax(0,1fr)] gap-2',
        'p-2',
      )}
      >
        {/* 2. Top-level Category Filter Tabs */}
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full shrink-0"
        >
          <TabsList className="
            flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent
          "
          >
            {categoryOptions.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="
                  rounded-full border border-border/60 bg-background text-xs
                  font-semibold
                  data-[state=active]:border-primary
                  data-[state=active]:bg-primary
                  data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-xs
                "
              >
                {category === 'all' ? t('faq.allCategories') : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* 3. Main DataGrid Card */}
        <SectionCard
          textSize="sm"
          title={selectedCategory === 'all' ? t('faq.allCategories') : selectedCategory}
          description={t('faq.totalCount', { count: faqs.length })}
        >
          <SectionCard.Content className="grid grid-rows-[auto_1fr]">
            <DataGridToolbar
              table={table}
              searchPlaceholder={t('faq.searchPlaceholder')}
              searchOnly
            />

            {faqs.length === 0 && (
              <div className="
                flex flex-col items-center justify-center gap-3 text-center
              "
              >
                <div className="
                  flex size-12 items-center justify-center rounded-full bg-muted
                  text-muted-foreground
                "
                >
                  <MessageCircleQuestion className="size-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {table.getState().globalFilter ? t('faq.noResults') : t('faq.noFaqs')}
                </p>
              </div>
            )}

            {faqs.length > 0 && (
              <Accordion className="w-full size-full">
                <DataGrid
                  table={table}
                  hideHeader
                />
              </Accordion>
            )}
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
