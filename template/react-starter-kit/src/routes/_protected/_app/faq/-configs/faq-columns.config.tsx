import { createColumnHelper } from '@tanstack/react-table';

import type { FaqItemDto } from '#/.generated/api/model';
import { AccordionContent, AccordionItem, AccordionTrigger, Badge } from '#/.generated/shadcn/components/ui';

const columnHelper = createColumnHelper<FaqItemDto>();

export function createFaqColumns() {
  return [
    columnHelper.display({
      id: 'faqAccordion',
      header: () => null,
      cell: ({ row }) => {
        const faq = row.original;
        return (
          <AccordionItem value={faq.id} className="border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center gap-3 text-left">
                <Badge
                  variant="secondary"
                  className="shrink-0 text-xs font-semibold"
                >
                  {faq.category}
                </Badge>
                <span className="text-sm font-semibold text-foreground">{faq.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="">
              <div className="
                rounded-lg bg-muted/40 text-sm/relaxed text-muted-foreground
              "
              >
                <p className="whitespace-pre-wrap">{faq.answer}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      },
    }),
  ];
}
