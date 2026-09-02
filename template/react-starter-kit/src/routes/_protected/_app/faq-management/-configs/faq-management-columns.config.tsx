import { createColumnHelper } from '@tanstack/react-table';
import { Eye, EyeOff, HelpCircle, Pencil, Trash2 } from 'lucide-react';

import type { FaqItemDto } from '#/.generated/api/model';
import { Badge, Button } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

const columnHelper = createColumnHelper<FaqItemDto>();

type FaqColumnDependencies = {
  i18n: ReturnType<typeof useI18n>['i18n']
  onEdit: (faq: FaqItemDto) => void
  onDelete: (faq: FaqItemDto) => void
};

export function createFaqManagementColumns({ i18n, onEdit, onDelete }: FaqColumnDependencies) {
  const language = i18n.resolvedLanguage ?? i18n.language;
  const translate = i18n.getFixedT(language);
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';
  return [
    columnHelper.accessor('order', {
      header: translate('faq.order'),
      cell: ({ getValue }) => (
        <div className="flex items-center justify-center">
          <span className="font-mono text-xs text-muted-foreground">
            {getValue()}
          </span>
        </div>
      ),
      size: 70,
    }),
    columnHelper.accessor('category', {
      header: translate('faq.category'),
      cell: ({ getValue }) => <Badge variant="secondary" className="font-normal">{getValue()}</Badge>,
      size: 130,
    }),
    columnHelper.accessor('question', {
      header: translate('faq.question'),
      cell: ({ row }) => (
        <div className="">
          <div className="
            flex items-center gap-1.5 font-medium text-foreground truncate
          "
          >
            <HelpCircle className="size-3.5 shrink-0 text-primary/70" />
            <span className="truncate">{row.original.question}</span>
          </div>
          <div className="truncate text-xs text-muted-foreground">{row.original.answer}</div>
        </div>
      ),
      size: 380,
    }),
    columnHelper.accessor('isPublished', {
      header: translate('faq.isPublished'),
      cell: ({ getValue }) => getValue()
        ? (
          <Badge className="
            gap-1 border-emerald-500/30 bg-emerald-500/10 font-normal
            text-emerald-600
            dark:text-emerald-400
          "
          >
            <Eye className="size-3" />
            {translate('faq.published')}
          </Badge>
        )
        : (
          <Badge
            variant="outline"
            className="gap-1 font-normal text-muted-foreground"
          >
            <EyeOff className="size-3" />
            {translate('faq.unpublished')}
          </Badge>
        ),
      size: 110,
    }),
    columnHelper.accessor('createdAt', {
      header: translate('notices.createdAt'),
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{new Date(getValue()).toLocaleDateString(dateLocale)}</span>,
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: translate('common.manage'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(row.original);
            }}
            title={translate('faq.editFaq')}
            aria-label={translate('faq.editFaq')}
          >
            <Pencil className="
              size-4 text-muted-foreground
              hover:text-foreground
            "
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row.original);
            }}
            title={translate('faq.deleteFaq')}
            aria-label={translate('faq.deleteFaq')}
          >
            <Trash2 className="
              size-4 text-destructive/80
              hover:text-destructive
            "
            />
          </Button>
        </div>
      ),
      size: 80,
    }),
  ];
}
