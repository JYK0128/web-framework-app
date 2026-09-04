import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { TermEditorForm } from './term-editor-form';

type TermCreateDialogProps = DialogComponentProps<boolean> & {
  termGroupId: string
};

export function TermCreateDialog({
  termGroupId,
  open,
  onOpenChange,
  close,
}: TermCreateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('terms.createTitle')}</DialogTitle>
          <DialogDescription>{t('terms.editorDescription')}</DialogDescription>
        </DialogHeader>
        <TermEditorForm term={null} termGroupId={termGroupId} onSuccess={() => close?.(true)} />
      </DialogContent>
    </Dialog>
  );
}
