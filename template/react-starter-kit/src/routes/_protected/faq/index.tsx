import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, HelpCircle, MessageSquareQuestion, Search, ThumbsUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getFaqsControllerGetFaqsQueryKey, useFaqsControllerGetFaqs, useFaqsControllerMarkHelpful } from '#/.generated/api/endpoints/faqs/faqs';
import type { FaqItemDto } from '#/.generated/api/model';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';

export const Route = createFileRoute('/_protected/faq/')({
  component: FaqBoardPageComponent,
});

function FaqBoardPageComponent() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [helpfulGiven, setHelpfulGiven] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useFaqsControllerGetFaqs(
    {
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: search.trim() ? search.trim() : undefined,
    },
  );

  const markHelpfulMutation = useFaqsControllerMarkHelpful();

  const handleHelpful = async (faq: FaqItemDto, e: React.MouseEvent) => {
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
  };

  const faqs = data?.items ?? [];
  const categories = useMemo(() => ['all', ...(data?.categories ?? [])], [data?.categories]);

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

      {/* Search and Category Filter Bar */}
      <Card className="border-border/60 bg-card/60 shadow-xs backdrop-blur-md">
        <CardContent className="
          flex flex-col gap-4 p-4
          sm:p-5
        "
        >
          <div className="relative">
            <Search className="
              absolute top-1/2 left-3 size-4 -translate-y-1/2
              text-muted-foreground
            "
            />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('faq.searchPlaceholder')}
              className="h-10 pl-9"
            />
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
                      `
                        h-8 rounded-full px-3 text-xs font-semibold
                        transition-all
                      `,
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
        </CardContent>
      </Card>

      {/* FAQ Accordion List */}
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
                <MessageSquareQuestion className="size-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {search ? t('faq.noResults') : t('faq.noFaqs')}
              </p>
            </div>
          )}

          {!isLoading && faqs.length > 0 && (
            <Accordion className="divide-y divide-border/60 px-6">
              {faqs.map((faq) => {
                const isHelpful = Boolean(helpfulGiven[faq.id]);

                return (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border-none py-3"
                  >
                    <AccordionTrigger className="
                      py-2
                      hover:no-underline
                    "
                    >
                      <div className="
                        flex flex-1 items-center gap-3 pr-4 text-left
                      "
                      >
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
                        rounded-lg bg-muted/40 p-4 text-sm/relaxed
                        text-muted-foreground
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
                              ? (
                                <Check className="size-3.5" />
                              )
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
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
