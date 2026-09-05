import { FileText } from 'lucide-react';

import type { AgreementDto } from '#/.generated/api/model';
import { Badge, Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

type TermDetailDialogProps = DialogComponentProps<void> & {
  term: AgreementDto
};

export function TermDetailDialog({
  term,
  open,
  onOpenChange,
}: TermDetailDialogProps) {
  const { t } = useI18n();

  if (!term) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <DialogTitle className="text-base font-bold">
              {term.title}
            </DialogTitle>
            <Badge
              variant={term.isRequired ? 'default' : 'secondary'}
              className="text-[10px] font-bold"
            >
              {term.isRequired
                ? t('onboarding.required')
                : t('onboarding.optional')}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('onboarding.termsSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="
          max-h-96 overflow-y-auto rounded-lg border border-border/60
          bg-muted/30 p-4 text-xs/relaxed text-muted-foreground
        "
        >
          <p className="whitespace-pre-line text-xs/relaxed">
            {term.content}
          </p>
        </div>

        <DialogFooter className="
          flex gap-2
          sm:justify-end
        "
        >
          <DialogClose
            render={(
              <Button type="button" variant="outline" size="sm">
                {t('app.dialog.close')}
              </Button>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
