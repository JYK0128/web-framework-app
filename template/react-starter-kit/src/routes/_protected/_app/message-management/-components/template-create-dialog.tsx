import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/app';
import { useI18n } from '#/hooks';

import { TemplateEditorForm } from './template-editor-form';

type TemplateCreateDialogProps = DialogComponentProps<boolean>;

export function TemplateCreateDialog({
  open,
  onOpenChange,
  close,
}: TemplateCreateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('templates.createTitle')}</DialogTitle>
          <DialogDescription>{t('templates.createDescription')}</DialogDescription>
        </DialogHeader>
        <TemplateEditorForm template={null} onSuccess={() => close?.(true)} />
      </DialogContent>
    </Dialog>
  );
}
