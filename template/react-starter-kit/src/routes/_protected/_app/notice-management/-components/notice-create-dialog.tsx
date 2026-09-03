import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { type DialogComponentProps } from '#/components/app';
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
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('notices.createTitle')}</DialogTitle>
        </DialogHeader>
        <NoticeEditorForm
          notice={null}
          onSuccess={() => close?.(true)}
        />
      </DialogContent>
    </Dialog>
  );
}
