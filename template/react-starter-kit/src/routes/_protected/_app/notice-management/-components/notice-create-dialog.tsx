import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { NoticeEditorForm } from './notice-editor-form';

type NoticeCreateDialogProps = DialogComponentProps<boolean>;

export function NoticeCreateDialog({
  open,
  onOpenChange,
  close,
}: NoticeCreateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('noticeManagement.createTitle')}</DialogTitle>
        </DialogHeader>
        <div className="scroll-y flex-1">
          <NoticeEditorForm
            notice={null}
            onSuccess={() => close?.(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
