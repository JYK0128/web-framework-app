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
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('notices.editTitle')}</DialogTitle>
        </DialogHeader>
        <NoticeEditorForm
          key={notice.id}
          notice={notice}
          onSuccess={() => close?.(true)}
        />
      </DialogContent>
    </Dialog>
  );
}
