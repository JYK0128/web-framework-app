import type { FaqItemDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { FaqEditorForm } from './faq-editor-form';

type FaqUpdateDialogProps = DialogComponentProps<boolean> & {
  faq: FaqItemDto
};

export function FaqUpdateDialog({
  faq,
  open,
  onOpenChange,
  close,
}: FaqUpdateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('faq.editDialogTitle')}</DialogTitle>
          <DialogDescription>{t('faq.editDialogDescription')}</DialogDescription>
        </DialogHeader>
        <FaqEditorForm
          key={faq.id}
          faq={faq}
          onSuccess={() => close?.(true)}
        />
      </DialogContent>
    </Dialog>
  );
}
