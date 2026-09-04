import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';

import { FaqEditorForm } from './faq-editor-form';

type FaqCreateDialogProps = DialogComponentProps<boolean>;

export function FaqCreateDialog({
  open,
  onOpenChange,
  close,
}: FaqCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>FAQ 추가</DialogTitle>
          <DialogDescription>새 FAQ 정보를 등록합니다.</DialogDescription>
        </DialogHeader>
        <FaqEditorForm faq={null} onSuccess={() => close?.(true)} />
      </DialogContent>
    </Dialog>
  );
}
