import type { AdminTermDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

type TermViewDialogProps = DialogComponentProps<void> & {
  term: AdminTermDto
};

export function TermViewDialog({
  term,
  open,
  onOpenChange,
}: TermViewDialogProps) {
  const { language, t } = useI18n();
  const dateLocale = language.startsWith('ko') ? 'ko-KR' : 'en-US';

  if (!term) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('termsManagement.viewTitle')}</DialogTitle>
          <DialogDescription>{term.version}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {t('termsManagement.fields.publishedAt')}
              {': '}
              {term.publishedAt ? new Date(term.publishedAt).toLocaleString(dateLocale) : '-'}
            </span>
            <Badge variant={term.isPublished ? 'default' : 'secondary'}>
              {term.isPublished ? t('termsManagement.published') : t('termsManagement.draft')}
            </Badge>
          </div>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">{t('termsManagement.fields.content')}</h3>
            <div className="
              max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md border
              bg-muted/20 text-sm/6
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
            onClick={() => onOpenChange?.(false)}
          >
            {t('app.dialog.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
