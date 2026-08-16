import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import { Check, HelpCircle, MessageCircleQuestion, ThumbsUp } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getFaqsControllerGetFaqsQueryKey, useFaqsControllerGetFaqs, useFaqsControllerMarkHelpful } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { DataGrid, DataGridToolbar, useDataGrid } from '#/components/data-grid';

export const Route = createFileRoute('/_protected/faq/')({
  component: FaqBoardPageComponent,
});

const columnHelper = createColumnHelper<FaqItemDto>();

function FaqBoardPageComponent() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [helpfulGiven, setHelpfulGiven] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useFaqsControllerGetFaqs({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: globalFilter.trim() ? globalFilter.trim() : undefined,
  });

  const markHelpfulMutation = useFaqsControllerMarkHelpful();

  const handleHelpful = useCallback(async (faq: FaqItemDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (helpfulGiven[faq.id] || markHelpfulMutation.isPending) return;

    try {
      setHelpfulGiven((prev) => ({ ...prev, [faq.id]: true }));
      await markHelpfulMutation.mutateAsync({ id: faq.id });
      await queryClient.invalidateQueries({ queryKey: getFaqsControllerGetFaqsQueryKey() });
    }
    catch {
      setHelpfulGiven((prev) => ({ ...prev, [faq.id]: false }));
    }
  }, [helpfulGiven, markHelpfulMutation, queryClient]);

  const faqs = useMemo(() => data?.items ?? [], [data?.items]);
  const categories = useMemo(() => ['all', ...(data?.categories ?? [])], [data?.categories]);

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
                    onClick={(e) => void handleHelpful(faq, e)}
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
    <div className="
      mx-auto flex size-full max-w-5xl flex-col gap-6 overflow-y-auto p-6
    "
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="
          flex items-center gap-2 text-2xl font-bold tracking-tight
        "
        >
          <HelpCircle className="size-6 text-primary" />
          {t('faq.boardTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('faq.boardDescription')}
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <Card className="border-border/60 bg-card/60 shadow-xs backdrop-blur-md">
        <DataGridToolbar
          table={table}
          searchPlaceholder={t('faq.searchPlaceholder')}
          searchOnly
        />

        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t p-4 pt-3">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Button
                  key={cat}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'h-8 rounded-full px-3 text-xs font-semibold transition-all',
                    isSelected
                      ? 'shadow-xs'
                      : `
                        text-muted-foreground
                        hover:text-foreground
                      `,
                  )}
                >
                  {cat === 'all' ? t('faq.allCategories') : cat}
                </Button>
              );
            })}
          </div>
        )}
      </Card>

      {/* FAQ DataGrid Accordion List */}
      <Card className="border-border/60">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {selectedCategory === 'all'
                ? t('faq.allCategories')
                : selectedCategory}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('faq.totalCount', { count: faqs.length })}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
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
            <Accordion className="divide-y divide-border/60 px-6">
              <DataGrid
                table={table}
                hideHeader
              />
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
