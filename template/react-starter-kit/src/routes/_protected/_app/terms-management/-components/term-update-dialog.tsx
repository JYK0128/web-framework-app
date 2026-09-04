import type { AdminTermDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { TermEditorForm } from './term-editor-form';

type TermUpdateDialogProps = DialogComponentProps<boolean> & {
  term: AdminTermDto
};

export function TermUpdateDialog({
  term,
  open,
  onOpenChange,
  close,
}: TermUpdateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('terms.editTitle')}</DialogTitle>
          <DialogDescription>{t('terms.editorDescription')}</DialogDescription>
        </DialogHeader>
        <TermEditorForm key={term.id} term={term} onSuccess={() => close?.(true)} />
      </DialogContent>
    </Dialog>
  );
}
