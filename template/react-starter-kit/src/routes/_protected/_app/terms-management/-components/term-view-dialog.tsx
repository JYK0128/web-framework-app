import { useI18n } from '@pkg/shared/web';
import { useState } from 'react';

import type { AdminTermDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

type TermViewDialogProps = {
  term: AdminTermDto | null
};

export function TermViewDialog({
  term,
}: TermViewDialogProps) {
  const [open, setOpen] = useState(Boolean(term));

  const { language, t } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  if (!open || !term) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {term && (
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('terms.viewTitle')}</DialogTitle>
            <DialogDescription>{term.version}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={term.isPublished ? 'default' : 'secondary'}>
                {term.isPublished ? t('terms.published') : t('terms.draft')}
              </Badge>
              <span className="text-muted-foreground">
                {t('terms.fields.publishedAt')}
                {': '}
                {term.publishedAt ? new Date(term.publishedAt).toLocaleString(dateLocale) : '-'}
              </span>
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold">{t('terms.fields.content')}</h3>
              <div className="
                max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md
                border bg-muted/20 text-sm/6
              "
              >
                {term.content}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
