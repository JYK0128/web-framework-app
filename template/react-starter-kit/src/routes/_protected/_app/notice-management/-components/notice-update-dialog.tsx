import type { NoticeItemDto } from '#/.generated/api/model';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/dialog';
import { useI18n } from '#/hooks';

import { NoticeEditorForm } from './notice-editor-form';

type NoticeUpdateDialogProps = DialogComponentProps<boolean> & {
  notice: NoticeItemDto
};

export function NoticeUpdateDialog({
  notice,
  open,
  onOpenChange,
  close,
}: NoticeUpdateDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('noticeManagement.editTitle')}</DialogTitle>
        </DialogHeader>
        <div className="scroll-y flex-1">
          <NoticeEditorForm
            key={notice.id}
            notice={notice}
            onSuccess={() => close?.(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
