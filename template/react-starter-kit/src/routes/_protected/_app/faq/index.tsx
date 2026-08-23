import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { Check, HelpCircle, MessageCircleQuestion, ThumbsUp } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { useFaqsControllerGetFaqs } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';

export const Route = createFileRoute('/_protected/_app/faq/')({
  component: FaqBoardPageComponent,
});

const columnHelper = createColumnHelper<FaqItemDto>();

function FaqBoardPageComponent() {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [helpfulGiven, setHelpfulGiven] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useFaqsControllerGetFaqs({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: globalFilter.trim() ? globalFilter.trim() : undefined,
  });

  const handleHelpful = useCallback((faq: FaqItemDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpfulGiven((prev) => ({ ...prev, [faq.id]: !prev[faq.id] }));
  }, []);

  const faqs: FaqItemDto[] = useMemo(() => data?.items ?? [], [data?.items]);

  const predefinedOrder = useMemo(() => [
    t('faq.categories.account'),
    t('faq.categories.service'),
    t('faq.categories.billing'),
    t('faq.categories.security'),
    t('faq.categories.etc'),
  ], [t]);

  const categories = useMemo(() => {
    const apiCats = [...(data?.categories ?? [])];
    apiCats.sort((a, b) => {
      const idxA = predefinedOrder.indexOf(a);
      const idxB = predefinedOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return ['all', ...apiCats];
  }, [data?.categories, predefinedOrder]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'faqAccordion',
      header: () => null,
      cell: ({ row }) => {
        const faq = row.original;
        const isHelpful = Boolean(helpfulGiven[faq.id]);

        return (
          <AccordionItem
            value={faq.id}
            className="border-none py-1"
          >
            <AccordionTrigger className="
              py-2.5
              hover:no-underline
            "
            >
              <div className="flex flex-1 items-center gap-3 pr-4 text-left">
                <Badge
                  variant="secondary"
                  className="shrink-0 text-xs font-semibold"
                >
                  {faq.category}
                </Badge>
                <span className="text-sm font-semibold text-foreground">
                  {faq.question}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="
                rounded-lg bg-muted/40 p-4 text-sm/relaxed text-muted-foreground
              "
              >
                <p className="whitespace-pre-wrap">{faq.answer}</p>

                <div className="
                  mt-4 flex items-center justify-end gap-2 border-t
                  border-border/40 pt-3
                "
                >
                  <Button
                    type="button"
                    variant={isHelpful ? 'default' : 'outline'}
                    size="xs"
                    onClick={(e) => handleHelpful(faq, e)}
                    className="gap-1.5 text-xs transition-all"
                  >
                    {isHelpful
                      ? <Check className="size-3.5" />
                      : (
                        <ThumbsUp className="size-3.5" />
                      )}
                    <span>{t('faq.helpful')}</span>
                    <span className="ml-0.5 font-bold">
                      {faq.helpfulCount + (isHelpful ? 1 : 0)}
                    </span>
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      },
    }),
  ], [handleHelpful, helpfulGiven, t]);

  const table = useDataGrid({
    client: false,
    cursor: true,
    data: faqs,
    columns,
    enableColumnFilters: false,
    enablePinning: false,
    onGlobalFilterChange: (value) => setGlobalFilter(String(value ?? '')),
    initialState: {
      globalFilter,
    },
  });

  return (
    <div className="mx-auto flex size-full max-w-7xl flex-col gap-6 p-6">
      {/* 1. Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="
            flex size-9 items-center justify-center rounded-lg bg-primary/10
            text-primary shadow-xs
          "
          >
            <HelpCircle className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('faq.boardTitle')}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('faq.boardDescription')}
        </p>
      </div>

      {/* 2. Top-level Category Filter Tabs */}
      {categories.length > 1 && (
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full shrink-0"
        >
          <TabsList className="
            flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0
          "
          >
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="
                  rounded-full border border-border/60 bg-background px-4 py-1.5
                  text-xs font-semibold
                  data-[state=active]:border-primary
                  data-[state=active]:bg-primary
                  data-[state=active]:text-primary-foreground
                  data-[state=active]:shadow-xs
                "
              >
                {cat === 'all' ? t('faq.allCategories') : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* 3. Main DataGrid Card */}
      <Card className="flex flex-1 min-h-0 flex-col overflow-hidden shadow-sm">
        <CardHeader className="shrink-0 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                {selectedCategory === 'all'
                  ? t('faq.allCategories')
                  : selectedCategory}
              </CardTitle>
              <CardDescription>
                {t('faq.totalCount', { count: faqs.length })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="
          flex flex-1 min-h-0 flex-col overflow-hidden p-0
        "
        >
          <DataGridToolbar
            table={table}
            searchPlaceholder={t('faq.searchPlaceholder')}
            searchOnly
          />

          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading && (
              <div className="
                flex items-center justify-center p-12 text-sm
                text-muted-foreground
              "
              >
                {t('common.loading')}
              </div>
            )}

            {!isLoading && faqs.length === 0 && (
              <div className="
                flex flex-col items-center justify-center gap-3 p-12 text-center
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
                  {globalFilter ? t('faq.noResults') : t('faq.noFaqs')}
                </p>
              </div>
            )}

            {!isLoading && faqs.length > 0 && (
              <Accordion className="w-full">
                <DataGrid
                  table={table}
                  hideHeader
                />
              </Accordion>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
