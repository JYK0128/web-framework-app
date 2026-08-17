import { useI18n } from '@pkg/shared/web';

import type { AdminTermDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';

type TermViewDialogProps = {
  open: boolean
  term: AdminTermDto | null
  onOpenChange: (open: boolean) => void
};

export function TermViewDialog({ open, term, onOpenChange }: TermViewDialogProps) {
  const { language, t } = useI18n();
  if (!term) return null;

  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {t('terms.publishedAt')}
              {': '}
              {term.publishedAt ? new Date(term.publishedAt).toLocaleString(dateLocale) : '-'}
            </span>
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">{t('terms.content')}</h3>
            <div className="
              max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md border
              bg-muted/20 p-4 text-sm/6
            "
            >
              {term.content}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
