import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { TermGroupEditorForm } from './term-group-editor-form';

type TermGroupCreateDialogProps = DialogComponentProps<string>;

export function TermGroupCreateDialog({
  open,
  onOpenChange,
  close,
}: TermGroupCreateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('termsManagement.createGroupTitle')}</DialogTitle>
          <DialogDescription>{t('termsManagement.groupEditorDescription')}</DialogDescription>
        </DialogHeader>
        <TermGroupEditorForm
          onSuccess={(id) => close?.(id)}
          onCancel={() => onOpenChange?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
