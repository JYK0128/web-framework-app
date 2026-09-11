import type { AdminTermItemDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { TermEditorForm } from './term-editor-form';

type TermUpdateDialogProps = DialogComponentProps<boolean> & {
  term: AdminTermItemDto
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
      <DialogContent className="max-h-[92vh] max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('termsManagement.editTitle')}</DialogTitle>
          <DialogDescription>{t('termsManagement.editorDescription')}</DialogDescription>
        </DialogHeader>
        <div className="scroll-y flex-1">
          <TermEditorForm
            key={term.id}
            term={term}
            onSuccess={() => close?.(true)}
            onCancel={() => close?.(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
